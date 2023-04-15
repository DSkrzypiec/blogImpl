---
date: "2023-04-15"
tags: ["data", "python", "rust"]
title: "Polars - modern data frame library"
toc: false
draft: false
---

## Intro

Almost five years passed since last time I've extensively used data frame library to calculate things. I sort of
switched from analyzing data and building application around that to more "regular" programming and data engineering. I
sometimes still use `data.table` in R or `pandas` in Python for ad-hoc analysis but nowadays I rarely need to do it.
For completeness I should add that data frame library is a software library that support operations on data frames
which are some kind of tables, usually kept in memory used for data analysis.

Recently I was exposed to [polars](https://www.pola.rs). As they describe *Lightning-fast DataFrame library for Rust
and Python*. Initially I was neutral, thinking "ok just another data frame library just written in rust", but it turned
out to be better in several aspects than other libraries of this kind. I got excited about data frame library again, I
didn't expect this to happen.

In this post I'm gonna describe why I thinks it's better alternative to pandas, `dplyr` or `data.table` and why I'm
excited.


## My history with data frame libraries

At the beginning of my career, when I was basically a data analyst, I used data frame libraries daily. Mostly I used
`dplyr` and `data.table` in R and when I was working in Python I've used `pandas`. After around 2-3 years using mainly
`dplyr` I switched to `data.table` due to better performance, more stable API and much fewer dependencies.


## Sample of syntax

I think it's a good idea to expose sample of Polars syntax before we move on. Here is a sample of basic usage of Polars
library in Python

```
import polars as pl


df = pl.DataFrame(
    {
        "A": [1, 2, 3, 4, 5],
        "fruits": ["banana", "banana", "apple", "apple", "banana"],
        "B": [5, 4, 3, 2, 1],
        "cars": ["beetle", "audi", "beetle", "beetle", "beetle"],
    }
)

df2 = (
    df.select(
        pl.col("A"),
        pl.col("fruits"),
        pl.col("B").max().alias("B_max")
    )
    .filter(pl.col("fruits") != "banana")
    .groupby("fruits")
    .agg(
        pl.col("A").sum().alias("A_sum"),
        pl.col("B_max").max()
    )
)
```

We can see there a simple manipulation on columns, filtration and aggregation.


## Why am I excited about Polars?


### Lazy evaluation

Polars provide very solid implementation of lazy evaluation comparing to other data frame libraries. To perform
transformations in lazy fashion you just need to call `.lazy()` method on a `DataFrame` which would convert it to
`LazyFrame` which has almost identical API as regular `DataFrame`. The difference is that operation will be performed
when `.collect()` method will be called. There are at least two advantages of using this approach. One is a room for
optimization. Usually we perform many operations on data frames. In (default) eager mode top-level operations are
executed sequentially. In lazy approach, just before `.collect()` we are aware of all operations and the engine can
perform optimization because at the time no operation is being executed yet. I've not precisely measure the difference in
performance but it feels to be significant. Let's consider the following example on a ~4GB data frame.

```
df2 = (
    df
    .select(
        pl.when(pl.col("id") % 13 == 0).then(-1).otherwise(pl.col("id")).alias("special_id"),
        pl.col("animal"),
        pl.col("rand_num")
    )
    .filter(
        (pl.col("rand_num") >= 50.0) & (pl.col("rand_num") < 250.0))
    .groupby("animal")
    .agg(
        pl.col("rand_num").mean().alias("rand_num_avg"),
        pl.col("rand_num").max().alias("rand_num_max"),
        pl.col("rand_num").filter(pl.col("special_id") == -1).mean().alias("rand_num_special_avg")
    )
    .sort("animal")
)
```

It took on my MacBook Air M1 (8GB RAM) around 12 seconds to calculate. When we use lazy API which differers only in
adding `.lazy()` and `.collect()`:

```
df2 = (
    df
    .lazy()
    .select(
        ...
    .sort("animal")
    .collect()
)
```

it takes on average 8 seconds. This was very straightforward transformation and still we got over 30% faster using lazy
API. Moreover lazy API is very convenient to split transformation into multiply functions where each takes
`polars.LazyFrame` as input argument and return `polars.LazyFrame`.


The second important advantage of lazy evaluation is operating on bigger data then fits in memory but still using the
same API. We can use [scan_csv](https://pola-rs.github.io/polars/py-polars/html/reference/api/polars.scan_csv.html) to
lazily read data from disk. Here's an example of data aggregation done on 27GB file on 8GB RAM MacBook:


```
# Analyzing 27GB data file on 8GB RAM
df_big = pl.scan_csv(source='test.csv', has_header=True, sep=";")

(
    df_big
    .groupby('animal')
    .agg(
        [
            pl.count().alias('cnt'),
            pl.sum('rand_num').alias('rand_num_sum'),
            pl.avg('rand_num').alias('rand_num_avg')
        ]
    )
    .collect()
)
```

It was executed on average in 38 seconds. For comparison I've run similar aggregation, but just for single sum to keep
it even simpler on AWK using the following command

```
awk -F ';' '{ x[$2] += $3 } END { print x }' test.csv
```

It took 16 minutes(!) on the same 27GB csv file.


### Expressions

One of fundamental building blocks in Polars are Polars expressions. In general Polars expression is any function that
transforms Polars series into another Polars series. There are few advantageous aspects of Polars expressions. Firstly
expressions are optimized. Particularly if expression need to be executed on multiple columns, then it will be
parallelized. It's one of reasons behind Polars high performance. Another aspect is the fact the Polars implements an
extensive set of builtin expressions that user can compose (chain) into more complex expressions. Functional approach
of chaining expressions enable great developer experience in my opinion. We have already seen some examples of
expressions like

```
pl.col("A").sum().alias("A_sum")
```

What I additionally really like about expression is the fact that it's a separate thing. Somewhat detached from
`DataFrame` object itself. What I mean is that we can freely define custom transformation in isolation from the actual
data on which we would apply those transformation. In real world use cases of data frame libraries data transformations
get very complex in matter of seconds. Having a way to break down complexity in clean form and without impact on
performance is in my opinion one of the most important characteristics.

Let's consider the following example

```
def sum_positive(expr: pl.Expr) -> pl.Expr:
    return expr.filter(expr > 0).sum()

def merge_if(col_name_a: str, col_name_b: str, predicate: pl.Expr) -> pl.Expr:
    """Merges two columns into one by given predicate"""
    return (
        pl.when(predicate).
        then(pl.col(col_name_a)).
        otherwise(pl.col(col_name_b))
    )

df.with_columns(
    sum_positive(pl.col("B")).alias("B_sum_pos")
).with_columns(
    merge_if("B", "B_sum_pos", pl.col("fruits") == "banana").alias("B_or_pos")
)


shape: (5, 6)
┌─────┬────────┬─────┬────────┬───────────┬──────────┐
│ A   ┆ fruits ┆ B   ┆ cars   ┆ B_sum_pos ┆ B_or_pos │
│ --- ┆ ---    ┆ --- ┆ ---    ┆ ---       ┆ ---      │
│ i64 ┆ str    ┆ i64 ┆ str    ┆ i64       ┆ i64      │
╞═════╪════════╪═════╪════════╪═══════════╪══════════╡
│ 1   ┆ banana ┆ 5   ┆ beetle ┆ 15        ┆ 5        │
│ 2   ┆ banana ┆ 4   ┆ audi   ┆ 15        ┆ 4        │
│ 3   ┆ apple  ┆ 3   ┆ beetle ┆ 15        ┆ 15       │
│ 4   ┆ apple  ┆ 2   ┆ beetle ┆ 15        ┆ 15       │
│ 5   ┆ banana ┆ 1   ┆ beetle ┆ 15        ┆ 1        │
└─────┴────────┴─────┴────────┴───────────┴──────────┘
```

We defined functions that either takes a Polar expression or strings which are meant to be column names. Usually
`pl.Expr` sounds more generic but in case when this expression is mostly use for `pl.col(_)` case, then probably
choosing string-based API would be more concise. Anyway the fact that we can compose and decompose expressions is
great.


### Apache Arrow format

Polars uses [Apache Arrow](https://arrow.apache.org) format for storing the data in data frame. It's very cool, because
Apache Arrow format is very cool. Apache aims to standardize data format for fast and efficient computation. The
standardization part here is the most important. If you need to exchange data between systems and all of them know how
to read/write the same (binary) format, then there is no need to serialization and deserialization which causes a lot
of waste. In my personal experience it was a huge win when we use Polars together with [Ray](https://www.ray.io). We
can store and then retrieve Polars data frames from ray without any serialization, which improved performance and made
interoperability seamless.


### Python-Rust interoperability

Polars, as name suggests (Pola[rs]), is written primarily in Rust but is also exposed as Python library. What I really like
it is the fact that one can easily implement new custom transformation in Rust and intergate it with Polars in
Python. More details in the next paragraph.


## Rust

As I said I really like Polars implementation in Rust. Writing high performance transformation run in parallel or async
is much easier then doing the same in C. At least for some people. So if you have crucial piece of data transformation
that is run frequently and probably on big data sets and needs to be executed as fast as possible you can spend some
time and write custom optimized implementation in Rust and then use it from your Python project.

I've tried to do so. It was my first time writing Python module in Rust. It turned out to be simpler then I thought.
Let me briefly sketch how minimal setup looks like.


### Python module written in Rust

To write a Python module in rust one can use great library [pyo3](https://pyo3.rs/v0.18.2/) which defines Python
bindings in Rust. Another tool which helped me with this task was [maturin](https://pypi.org/project/maturin/) a Python
library for building and publishing Rust code as a Python module. It's not necessary but it's very convenient. If you
want to follow above examples you need to have Python (3.x) and Rust compiler installed.

Let's start from creating a new project and virtual env:

```
mkdir rust_from_python
cd rust_from_python
python3 -m venv .venv
source .venv/bin/activate
pip install maturin
```

Now we can create a new Rust project within `rust_from_python` catalog using `maturin new` command.

```
maturin new my_rust_module

# You can choose option how it can be created (I use pyo3)
# The following catalog will be created:

.
└── my_rust_module
    ├── Cargo.toml
    ├── pyproject.toml
    └── src
        └── lib.rs

3 directories, 3 files
```

By default `./my_rust_module/src/lib.rs` contains a single function `sum_as_string` as an example:

```
use pyo3::prelude::*;

/// Formats the sum of two numbers as string.
#[pyfunction]
fn sum_as_string(a: usize, b: usize) -> PyResult<String> {
    Ok((a + b).to_string())
}

/// A Python module implemented in Rust.
#[pymodule]
fn my_rust_module(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(sum_as_string, m)?)?;
    Ok(())
}

```

To build the Rust project as a Python module using maturin we can simply execute `maturin develop` from
`./my_rust_module` catalog. And it's done! Easy as that. Now we can use it in our Python project. For example let's
create a `main.py` script in the `rust_from_python` top catalog:

```
from my_rust_module import sum_as_string

def main() -> None:
    print(sum_as_string(42, 13))

if __name__ == '__main__':
    main()
```

Now we can just run it and we'll get `55` as a result.


### Polars extension in Rust

Author or Polars, Ritchie Vink, wrote additionally a helper Rust crate (library)
[pyo3-polars](https://github.com/pola-rs/pyo3-polars) to make passing `DataFrame` and `Series` between Python and Rust
even simpler. This crate basically defines two new types in Rust `PyDataFrame` and `PySeries` which can be converted to
and from Python Polars `DataFrame` and `Series`.

Now let's try to add new function written in Rust that will take a polars `DataFrame` from Python, then will calculate
a new column in Rust and return it back to Python. To do so we need to add `polars` and `pyo3-polars` dependencies in
our `my_rust_module` project.

```
// Cargo.toml

[dependencies]
polars = { version = "0.27.2", features = ["fmt"] }
polars-core = { version = "0.27.2" }
pyo3-polars = "0.2.0"
```

Now we can add new function `calc_new_column_in_rust` which takes a Polars `DataFrame` from Python, calculates a new
column in Rust and finally return Python Polars `DataFrame` back to Python. Our `./my_rust_module/src/lib.rs` after
adding new function looks like this

```
use pyo3::prelude::*;
use pyo3::exceptions::PyBaseException;
use pyo3_polars::PyDataFrame;
use polars::frame::DataFrame;
use polars_core::prelude::*;


/// Formats the sum of two numbers as string.
#[pyfunction]
fn sum_as_string(a: usize, b: usize) -> PyResult<String> {
    Ok((a + b).to_string())
}

/// A Python module implemented in Rust.
#[pymodule]
fn my_rust_module(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(sum_as_string, m)?)?;
    m.add_function(wrap_pyfunction!(calc_new_column_in_rust, m)?)?;
    Ok(())
}

#[pyfunction]
fn calc_new_column_in_rust(pydf: PyDataFrame, col_name: &str) -> PyResult<PyDataFrame> {
    let mut df: DataFrame = pydf.into();
    let rows = df.height();

    let mut xs: Vec<i32> = vec!{};
    for i in 0..rows {
        xs.push((i as i32) + 143 / 4)
    }

    let s = Series::new(col_name, &xs);
    let df2 = df.with_column(s);

    match df2 {
        Ok(frame) => Ok(PyDataFrame(frame.clone())),
        _ => Err(PyBaseException::new_err("Error from rust"))
    }
}
```

Now we are ready to do `maturin develop` once again to build new version of Rust extension module. Once it's done we
can use our new Rust function `calc_new_column_in_rust` in our Python code:


```
import polars as pl
from my_rust_module import sum_as_string, calc_new_column_in_rust

def main() -> None:
    print(sum_as_string(42, 13))
    df = pl.DataFrame({"A": [1, 42, 13, -10]})
    df2 = calc_new_column_in_rust(df, "rust_col")
    print(df2)


if __name__ == '__main__':
    main()

```

## Summary

In summary I really enjoyed Polars after my initial encounter. I liked it performance, expressions and how easy it is
to write custom extensions in Rust. For sure I'll continue to learn more about Polars. Perhaps it would be a good idea
to write few examples in Rust using Polars next time and take a closer look into Polars implementation details.

## References

1. [Polars](https://www.pola.rs)
1. [pyo3](https://pyo3.rs/v0.18.2/)
1. [pyo3-polars](https://github.com/pola-rs/pyo3-polars)
