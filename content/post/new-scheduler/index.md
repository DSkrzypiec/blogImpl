---
date: "2023-12-16"
tags: ["General", "Go"]
title: "Implementing new scheduler"
toc: false
draft: false
---


## Intro

I've started implementing yet another DAG scheduler, something like [Airflow](https://airflow.apache.org) or
[Luigi](https://github.com/spotify/luigi). This post is going to be on why I'm doing this and what I'm trying to
achieve.

Before we start, let me do short introduction about schedulers, in case you've never heard about it or use it yourself.
What in here I'm calling _scheduler_ is a program or software system which is responsible for scheduling execution of
tasks or another programs in particular order. That software can be also responsible for executing tasks, but the
emphasis is placed on scheduling and keeping track of all dependencies, it's statuses and so on.

One of the first such programs was (still used) [cron](https://man7.org/linux/man-pages/man8/cron.8.html) which is
Linux standard daemon for executing scheduled commands. It basically runs in the background and executes a command or a
script at particular time expressed by [crontab](https://man7.org/linux/man-pages/man5/crontab.5.html) - classic now `0
12 * * *` format. It is still used nowadays in some cases, because it's already installed on UNIX systems and requires
almost no setup.

Cron is rather simple regarding process definition - it's limited to single command or single script. In most of
modern schedulers a process is expressed using directed acyclic graph (DAG) of tasks. This way we can express patterns
in a process like task `B` can run in parallel to task `A` and task `C` cannot start before `A` and `B` are done. Those
processes usually run on a certain schedule. For example once a day at 8:00AM or each 15 minutes, but no on
weekends. Some of them might have no schedule but are triggered externally.

**TODO**: pic with a DAG

Where this kind of software is used? From my perspective and best to my knowledge it's mostly used to orchestrate data
processing. Let's consider an example where we need to prepare data for reporting layer. This process requires talking
to many data sources, perhaps migrating data between clouds, then doing transformation and aggregations on transformed
data. This might be very complex process and it needs to run everyday. In this example our DAG could have separate
tasks for migrating data, another for doing transformation in the database and yet another doing aggregations and
exporting reporting data to external data source. Having scheduler in this example gives us many positive points such
as:

* Process is defined in single place (hopefully via code)
* If anything break, you know exactly what to fix and what can be affected by the failure
* You can resume processing after fixing the bug, because you know where the process stopped and all dependencies are
  contained in the DAG
* Usually you have history of runs for processes with task durations and other statistics, so you can tell if there is
  a slowdown


A DAG of tasks provides the versatility to accurately represent any desired process. It doesn't need to be data
processing. It might be for example setting up an infrastructure or an end-to-end tests environment.


## How it started

In February 2023 I joined Point72 Risk Technology team, to help building new platform for computation and analytics. In
addition to distributed computation functionalities we also needed a scheduler for processes around this new platform.
We didn't want to use our legacy scheduler, because it was embedded in the "old" on-prem infrastructure. We decided to
go with [AWS MWAA](https://docs.aws.amazon.com/mwaa/latest/userguide/what-is-mwaa.html) which is managed version of
Airflow on AWS. At the time I was the only person on the team with actual hands-on experience with Airflow, so it was
my responsibility, to setup infrastructure for MWAA (Terraform), local development environment, CI/CD processes and
integration with other systems we use in Risk.

It was my second adventure with Airflow and this time I've had similar reflections. Airflow is very easy to use from
developer view point and has rather good UI, but on the other hand Airflow has poor performance, uses a lot of
resources and is not reliable. More about downsides of Airflow in another chapter.

At this point I thought that I really like high-level idea of a scheduler and I'd like to have improved version of
Airflow. Something that is flexible enough (cannot be more flexible then Python though), has very good performance and
is reliable and scalable. Also something that's easy to use locally or in simplified setup and at the same time can be
deployed in the cloud or/and using Kubernetes. Around the second half of August 2023 I started my vacation and also I
started thinking about high level architecture for a new scheduler written in Go and sketching implementation starting
from small problems like [Getting method's source code in Go](https://dskrzypiec.dev/go-ast/).


## Why new scheduler?





## Bonus - Airflow rant


## Summary


## References

1. 

