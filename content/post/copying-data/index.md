---
date: "2022-06-05"
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
1. Repeat

One can notice that there are two degrees of concurrency in this algorithm. In
order to provide efficient solution those degrees have to be set appropriately.


## Concurrency optimization

Naturally we should start our optimization with exploration of reasonable limits
of the load that our end systems, Cassandra and Snowflake, could take including
the constrains. On the Cassandra end few tests was enough to determine how many
concurrent requests per seconds could be sent to not oversaturate the cluster.
On the Snowflake end one of limitations was limit of queued queries for
particular [warehouse](https://docs.snowflake.com/en/user-guide/warehouses-overview.html).
Also number of rows in `VALUES` in `INSERT INTO` statement has its upper bound.
Since single batched `INSERT INTO` takes around 1-5 seconds in my case and there
is upper bound for queued queries I could easily estimate inserting data into
Snowflake safely and near maximum efficiency.

Now we're getting into the most interesting part of the problem. How to
integrate dynamics of two systems? For example let's say we would send to
Cassandra as many as possible concurrent requests (including the constrains).
It might turned out that inserting the data, which will be sent from Cassandra,
to Snowflake would take significantly longer than Cassandra response. In this
case traffic on the Cassandra clusters would be like: spike, long flat, spike,
long flat, etc. It also requires much more memory for the program which is
performing this copying in order to keep buffers for Cassandra response data.

We could get the same (or better) efficiency with fewer concurrent requests to
Cassandra if we minimize pauses between Snowflake's reaching its set limit and
next batch of requests to Cassandra. This optimization is a bit familiar to
classic [Lotka-Volterra equations](https://en.wikipedia.org/wiki/Lotka–Volterra_equations).

In general rate of generating outputs by the producer to rate of transforming
and inserting data by consumer is a crucial statistics to optimize.


## Go implementation

I wrote a program which implemented above algorithm in Go. It took around one
office day (few hours really) including implementation and tests for
concurrency optimization. That was really smooth! Mostly because of Go easy
concurrency model (goroutines and channels) and Go standard library [sync](https://pkg.go.dev/sync) for
providing basic synchronization primitives.

I cannot include code examples this time. What is the most important is a fact
that it was very easy to write general patterns like:

* send this `N` request concurrently
* in the meantime results are sent over the channel
* concurrently results are taken from channel and batched `INSERT INTO` are
  produced
* start sending asynchronous `INSERT`s into Snowflake
* if number of concurrent writers are reached its max than we wait

It was really easy to write correct concurrent algorithm based just on high
level plan using Go.


## Summary

Copying data usually is not very excited task. In this particular case the
constrains of the whole task and optimization aspect was rather interesting in
my opinion. There are many Cassandra caveats and possible networking
issues that was not mentioned here which also might be interesting.

Also if you got a bit less restrictive constrains you should use Cassandra
native `COPY TO` instead of writing custom concurrent program for moving data.


## References

1. [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load)
1. [ELT](https://en.wikipedia.org/wiki/Extract,_load,_transform)
1. [gocql](https://github.com/gocql/gocql)
