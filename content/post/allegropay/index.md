---
date: "2022-09-10"
tags: ["personal"]
title: "A year in Allegro Pay"
toc: false
draft: false
---

![img](allegropay_logo.jpg)

## Intro

In August 2021 [I left PwC](https://dskrzypiec.dev/leaving-pwc) and joined
Allegro Pay in role of senior data engineer. Allegro Pay is a fintech sub
company of the biggest e-commerce in central Europe -
[Allegro](https://allegro.pl). I've worked there for a year and in this post I
want to summarized my experiences. 


## Onboarding and first thoughts

Onboarding process in Allegro took four (4) days! That was very smooth
introduction without any hassle. There was presentations about company culture,
history and so on. It was rather pleasant experience.

In contrast to PwC, Allegro was a tech company from the beginning. One of example
of the difference is that Allegro have crucial internal IT systems centralized.
Like identity and access management. In PwC it was more dependent on a team and
region. In Allegro it's centralized. If I needed some access I immediately know
where should I make a request. The same remains true for all HR systems.

In PwC we mainly have used email as communication medium. Internal communicator
was used only for quick chats. History older than a day was deleted from
communicator, so all important information was exchanged via email. In Allegro
people use Slack. There are support and help channels for everything. It's very
easy to browse through channels and find information or just ask. In PwC often
I wouldn't know who should I ask, so usually things were flowing through my
direct manager.


## New technologies

When I've joined Allegro Pay data engineering team mainly used the following
technologies: Snowflake, Airflow and dbt in purely data layer and besides that
C# microservices. The first three I've never used prior joining Allegro.


### Snowflake

We've used [Snowflake](https://www.snowflake.com) as our main source for all
analytical data and even a bit more. From all new technologies that I learned
at Allegro Snowflake was easiest for me. Basically it's a modern, distributed
data [warehouse | lake | store] done right. In almost all aspects using
Snowflake was pure joy. It's just works. Regarding compression, performance and
general convenience it's just great.


### Apache Airflow

[Airflow](https://airflow.apache.org) was our main orchestrator for data
pipelines. In fall 2021 we started using Airflow on Google Cloud Platform in
form of [Cloud Composer](https://cloud.google.com/composer). I even liked the
main idea besides the design of Airflow but it has unbelievably poor
performance. Even first version of Composer (on the Cloud!) didn't resolve
those issues. I definitely wasn't a fan of this one. On the other hand Allegro
also uses Airflow and we've got support regarding Composer from another team.


### dbt

We've tried using [dbt](https://www.getdbt.com) as an alternative solution to
improve effectiveness of local development of Airflow DAGs. First POCs were
successful, so we decided to use it in one of our processes. Basically we were
developing data pipelines locally using dbt and later on we automatically
generate Airflow DAG based on dbt models (also DAGs). So final product was
still data pipeline in Airflow but development process doesn't require local
Airflow instance and rather slow feedback loop.


## Flashbacks from consulting

In October 2021 [Allegro Pay signed the
deal](https://www.bankier.pl/wiadomosc/Allegro-Pay-ma-umowe-sprzedazy-wierzytelnosci-z-Aion-Bankiem-saldo-niesplaconych-wierzytelnosci-moze-siegnac-2-mld-zl-8203280.html)
with [Aion Bank](https://aion.eu) for selling some exposures. In general
Allegro Pay would get paid and Aion, as rather new bank, would get portfolio of
exposures. This project was important for Allegro Pay because at the time
Allegro was also [acquiring Mall
Group](https://about.allegro.eu/news-releases/news-release-details/allegro-acquire-mall-group-leading-e-commerce-platform-across).

So the project was very important, deadline was really tight (3-4 weeks) and I
was responsible for designing and implementing a process for exposures (in
tranches) evaluation. Based on this evaluation actual offers, in form of formal
legal documents, were prepared and sent to Aion. Pressure was very real. Based
on this evaluation Allegro Pay would received 100-200mln PLN (~$40mln USD) in
single payment.

Just three months after I've escaped consulting I got into a project almost
exactly the same I would expected to happen only in consulting. Nevertheless my
experience was very good fit and I knew that for Allegro this is very unusual
project so I did it. It was the only period in my time in Allegro when I had to
done overtime. It was very intense couple of weeks.

At the end we pulled it off before the deadline. Including very tough
constrains I think we did very solid job. There wasn't single major mistake
both in technical and business aspects. That was a great success. I think that
in a regular bank or even consulting the same project would take a least 3
months for consulting and at least 10 months for a bank.


## AMD_2

Another rather big task in our roadmap was designing and implementing improved
version of AMD - `Analytical Data Model` (acronym in Polish is AMD). Analytical
model which gather and unify data for entities like "user", "purchase",
"payment" and other related with usual e-commerce kind of things. The first
version of those entities were implemented just after Allegro Pay was created -
about a year before I've joined. That was needed to be implemented really fast
in order to enable ML team to prepare features and models as soon as possible.
So obviously there was some shortcuts to meet the deadlines.

The main idea behind `AMD_2` was to improve all deficiencies of the initial
version. In the following subchapters I'll try to describe the most interesting
parts and decisions of designing and implementing this process.

### Depending only on operational events

Allegro is biggest or one of the biggest Polish tech companies. Even before
acquiring Mall Group Allegro had around 3000 employees. Most of them are
technical people. The Allegro on itself produce large amount of data but also
on top of that many teams of data analysts and data engineers produces many
data entities in many data lakes and other sources. It was a good decision to
use some of analytical entities from Allegro in Allegro Pay analytical model,
because it saves us much work of getting know all corners of business aspects
of this data. The main disadvantage of using some entity prepared by another
team in large organization is being dependent on this team and their decisions.
This team at some point in time might change structure or algorithm for this
entity and in this case we would have put some work to handle it.

In AMD_2 we've decided to be dependent only on operational events which are
generated by actual backend (and frontend) microservices and sent onto
[Hermes](https://github.com/allegro/hermes) which is Allegro's asynchronous
message broker built on top of Kafka.


### Using dbt

`AMD_2` was our first actual project where we used `dbt`. In general it was
very good experience. Local development was for sure much quicker than using
Airflow. The second advantage was testing in `dbt`. Tests in `dbt` are defined
as macros (templated SQLs) or regular SQL scripts which can be applied to any
model (tabel) and its columns using schema configuration in `YAML`. Therefore
it was very straightforward to prepare tests on each stage of transformation
process. Beginning at testing source inputs through executing tests after each
transformation and finishing at testing final entity results.

Even though `dbt` is a very convenient tool in final form we wanted `AMD_2` to
be accessible in our Composer (Apache Airflow in GCP). So one colleague from
our team write `DBTOperator` for wrapping `dbt` commands into Airflow operator
and used it to write translator from `dbt` DAGs into Airflow DAGs including
testing and execution of actual transformations. This can be done based on [dbt
manifest file](https://docs.getdbt.com/reference/artifacts/manifest-json) which
contains all of information regarding `dbt` DAGs and its metadata. As I
remember it took only around ~250 lines of Python code to implement this
translation.

Finally we could develop new entities locally using only `dbt` and Snowflake
but outside of local environment we've got Airflow DAG produced automatically.


## Integrating delivery addresses

One day it turned out that the source with the full history of delivery addresses
is no longer available. There was still a service and a database with last few
years of those data but not the full set. Why that happened is probably
interesting from perspective on working in large organization with many teams
and so on, but it's not important here.

For Allegro Pay this was a major problem, because one of our most important
processes was dependent on that data in full scope and not only last few years.

It was my task to handle this integration of historical data into single place.
This data was in few places - legacy Cassandra (v2.1) cluster on premise,
MongoDB also on premise and in Snowflake and BigQuery on two separate clouds.
Generally it sounds like a simple task. Just take a data from few places and
put it together. Easier said then done. There was a couple of challenges. For
instance dumping data from Cassandra and MongoDB. Data volume. Integrity of
this data over the time. Sending gigabytes of data between clouds. Fixing and
handling data formats and consistency. Most of those are regular data
engineering tasks. But almost direct impact on the business, scope and
complexity of this task was making it very rewarding and satisfying.

Some part of this problem I've described in
[Copying data between distributed systems](https://dskrzypiec.dev/copying-data/).


## Summary

Allegro is definitely a great place to work! People are great, work and
technologies are interesting. But at the same time the atmosphere is peaceful
and a good work-life balance is encouraged. For me it was a great year for
sure! I met very interesting and alike colleagues and also learned a lot.

