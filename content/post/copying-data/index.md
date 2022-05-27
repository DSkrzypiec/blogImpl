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

## Concurrency optimization

## Summary


## References

1. [Wiki](https://en.wikipedia.org/wiki/AWK)
