---
date: "2019-08-29"
tags: ["go", "database"]
title: "Go database/sql vs jmoiron/sqlx reading benchmark"
draft: true
markup: "mmark"
---

## Intro
While building most of projects or apps it is very common to read from a
database. In go standard way to do that is by using 
[database/sql](https://golang.org/pkg/database/sql/) standard library. 
To illustrate how it can be done let's load from database a bunch of
`Points` which are slice of `Point`s defined as follows


{{% code %}}
type Point struct {
    X int
    Y float64
}

type Points []Point
{{% /code %}}

Next listening contains definition of function `ReadPoints` which for existing
[`*sql.DB`](https://golang.org/pkg/database/sql/#DB) database connection reads 
`Points`. It tries to execute SQL query passed as string from function (not 
listed) `PointsQuery`. Then slice for results is created and in `for` loop 
there is reading row-per-row and writing points into `points` slice.


{{% code %}}
func ReadPoints(dbConn *sql.DB) Points {
    rows, qErr := dbConn.Query(PointsQuery())
    if qErr != nil {
        fmt.Println("Couldn't execute the query")
    }
    defer rows.Close()

    points := make(Points, 0, 10000)
    var (
        x int
        y float64
    )

    for rows.Next() {
        rows.Scan(&x, &y)
        points = append(points, Point{x, y})
    }
    return points
}
{{% /code %}}

This implementation of reading `Points` is independent of specific database. It
is based only on `database/sql` package and doesn't depends on specific database 
driver.

There is nothing wrong with this approach but it could be tedious in case when
you have to read dozens or even hundreds of queries from the database. Then you 
create (usually) one file per reading containing definition of the type for
query result, definition for query and reading function. Is there any more compact
solution? It would be great if something similar to
[`json.Unmarshal`](https://golang.org/pkg/encoding/json/#Unmarshal), which can
use struct's tags to read and writes JSONs, exists. Fortunately there is 
[`jmoiron/sqlx` package](https://github.com/jmoiron/sqlx).


## `jmoiron/sqlx` package
Package `sqlx` is open-source and MIT-licensed go package created to extend
functionalities from standard `database/sql` package. 

{{% blockquote author="sqlx README" %}}
sqlx is a library which provides a set of extensions on go's standard 
`database/sql` library. The sqlx versions of `sql.DB`, `sql.TX`, `sql.Stmt`, et al. all 
leave the underlying interfaces untouched, so that their interfaces are a 
superset on the standard ones. This makes it relatively painless to integrate 
existing codebases using `database/sql` with sqlx.
{{% /blockquote %}}

Regarding reading from database we are especially interested in
[`sqlx.Select`](https://godoc.org/github.com/jmoiron/sqlx#DB.Select)
function. To perform reading `Points` using this function we have to add 
[tags](https://stackoverflow.com/questions/10858787/what-are-the-uses-for-tags-in-go) 
in `Point` (assuming query contains column names "pointX" and "pointY") structure 
as follows

{{% code %}}
type Point struct {
	X int     `db:"pointX"`
	Y float64 `db:"pointY"`
}
{{% /code %}}

Now we can implement alternative (compact) version of function `ReadPoints`
using package `sqlx`. This version creates new slice of points, passes it into
`sqlx.Select` function together with the query to read points from database.

{{% code %}}
func ReadPointsSQLX(dbConn *sqlx.DB) Points {
    points := make(Points, 0, 10000)

    err := sqlx.Select(&points, PointsQuery())
    if err != nil {
        fmt.Println("Error while reading Points.")
    }

    return points
}
{{% /code %}}


Obviously `sqlx.Select` uses [reflection](https://golang.org/pkg/reflect/)
to deal with its input data (passes as `interface{}`). Therefore my question is
**How much do we pay for runtime overhead** using package `sqlx` instead of
standard approach? I want to answer this question by performing series of
benchmarks.


## Benchmark methodology
My first attemp to perform this benchmark was by using standard `go test -bench`
benchmark. It was somehow ok but it gave me only average time of reading. There 
was also difference if I would benchmark standard approach first then `sqlx` or
vice versa.

We have to keep in mind that our benchmark depends on database and its current
state. To perform faithful benchmark I've proposed the following algorithm:

1. Choose first method (standard vs `sqlx`) of reading at random (with equal
   distribution)
2. Perform first method reading
3. Perform second method reading
4. Save statistics
5. Wait for few seconds
6. Repeat from 1.

So this algorithm performs reading using both methods (sometimes in different 
order) in a chunk, then waits. In my opinion this approach assures that both
single reading are performed on database with its similar state. In results I've
also skipped first five measurements treating it as a warm-up.

In [Appendix](#appendix) there is description of enviorement I've used to
performe the following results.


## Benchmark results
Here will be benchmark results in tables and charts.

> Results for 2 columns

|      #Rows| Avg sql time [s]| Avg sqlx time [s]| Diff perc|
|-----------|---------|----------|------|
|      1 000|   0.0046|  0.0049| 6.80%|
|     10 000|   0.0228|  0.0237| 3.89%|
|    100 000|   0.1992|  0.2021| 1.42%|
|  1 000 000|   1.5478|  1.5529| 0.33%|
| 10 000 000|  25.7208| 27.1226| 5.17%|

> Results for 10 columns

|      #Rows| Avg sql time [s]| Avg sqlx time [s]| Diff perc|
|-----------|--------------|------------|---------|
|      1 000|  0.0096|  0.0100| 3.52%|
|     10 000|  0.0557|  0.0587| 5.15%|
|    100 000|  0.4968|  0.5099| 2.56%|
|  1 000 000|  6.2670|  6.4906| 3.44%|
| 10 000 000| 75.9548| 79.2614| 4.17%|


{{< figure
img="BenchmarkResults2columns.jpg" 
caption="Quantile plot for salaries sample to present how interpolation looks like in this case." 
command="Resize" 
options="800x" >}}


{{< figure
img="BenchmarkResults10columns.jpg" 
caption="Quantile plot for salaries sample to present how interpolation looks like in this case." 
command="Resize" 
options="700x" >}}

## Summary
Here will be summary.

## Appendix

{{% ticks %}}
* [Link to benchmark source codes](https://github.com/DSkrzypiec/blogSourceCodes/tree/master/20190823_GoSqlSqlx)
* OS - `Microsoft Windows 10 Home 10.0 Build 18362`
* Processor - `Intel Core i5-7200U, 2.50Ghz 2.71Ghz`
* Hard disk - `LITE-ON CB1-SD256 (SDD)`
* Database - `PostreSQL 10.10, compiled by Visual C++ build 1800, 64-bit`
* go version - `go1.13beta1 windows/amd64`
* go database driver package - `github.com/lib/pq`

{{% /ticks %}}
