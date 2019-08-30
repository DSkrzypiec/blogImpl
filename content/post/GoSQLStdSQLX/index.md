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
Description of benchmark methodology.

## Benchmark results
Here will be benchmark results in tables and charts.

## Summary
Here will be summary.

