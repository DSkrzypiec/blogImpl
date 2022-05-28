---
date: "2022-05-27"
tags: ["Data engineering"]
title: "Copying data between distributed systems"
toc: false
draft: false
---

## Intro

Transforming data from one form into another is the primary task of every
programmer. For data engineers very common task is to move or copy data
between two or more data sources with
[ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load) or
[ELT](https://en.wikipedia.org/wiki/Extract,_load,_transform) processes.
Usually implementation of those processes are very high level. Glueing few
libraries into a script, or some
[operators](https://airflow.apache.org/docs/apache-airflow/stable/concepts/operators.html)
into a DAG in Python. Although not always. There are more interesting cases.
Recently I've had one and I wanted to write a bit about this particular
problem and possible solutions.


## The problem

The main problem was to copy rather large amount of data from very legacy
database (Apache Cassandra 2.1) located on premise data center into
cloud-based [Snowflake](https://www.snowflake.com).

## Constrains

The table which shall be copied doesn't have any event time stamps or dates.
Partition is based on `user_id` column and clustering on UUID column. Table is
rather big (surely > 1TB) but I don't know exactly because `SELECT COUNT(*)
FROM ...` on Cassandra haven't succeeded in few hours. Therefore using builtin
Cassandra's `COPY TO` is a bit risky in terms of capacity of local storage. Also
it cannot be deterministically resumed once it's halted. Also data format
should be suitable for Snowflake. This should be one time migration. It will
not be a cyclical process. We must not oversaturate Cassandra cluster.


## High level solution

In consideration to the above constrains I decided to sketch custom copying
program in Go which would connect to Cassandra (using `gocql` library), connect
to Snowflake and somehow efficiently copy the data with extra schema
validation.

After initial testing it was clear that Cassandra responses very quickly and
consistently for queries of the form

``` SELECT * FROM ... WHERE user_id = $id ```


That's great, because we already have (in Snowflake) a set of all existing
`user_id` values. The upside of this approach is that we can stop and resume
copying as we like because we know what `user_ids` have been already copied.
Also this program doesn't require much disk space (just for the binary) and RAM
(configurable by copying parameters).

The downside is possible many rather small requests to Cassandra which in
general could be (and almost always is) slower than using native `COPY TO`. But
in light of the constrains it is a necessary cost that we have to pay.

Let's outline high level phases of the algorithm:

1. Get a set of `user_id` values that shall be copied
1. Send a bunch of concurrent calls to Cassandra, one for each `user_id`
1. Asynchronously deserialize data and put it in a shared collection
1. Start sending batched `INSERT INTO` statements into Snowflake concurrently
1. Wait before another batch of aync calls to Cassandra only when number of
   goroutines responsible for sending data to Snowflake reaches its limit
1. Repeat from start

One can notice that there are two degrees of concurrency in this algorithm. In
order to provide efficient solution those degrees have to be set appropriately.


## Concurrency optimization

## Summary


## References

1. [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load)
1. [ELT](https://en.wikipedia.org/wiki/Extract,_load,_transform)
1. [gocql](https://github.com/gocql/gocql)
