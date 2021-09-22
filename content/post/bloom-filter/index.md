---
date: "2021-09-22"
tags: ["Data Structures"]
title: "Bloom filter"
toc: false
draft: true
---


## Intro

At one of mine job interviews I was asked how would I check if there is a
user name in continues stream of data without possibility of storing data on the
disc. I had a good intuition but I didn't expected that probabilistic answer
would be sufficient and I haven't ever heard about Bloom filters to that point.

Bloom filter is a data structure. It exists to help answer the question "Does
this element (probably) exist in the set?" or "Does this element surely not
exist in the set?". Especially when the search set is very large, because it is
very space efficient. Also it is a probabilistic data structure - more about it
later.

I found this data structure very interesting. The main idea is brilliant.
In this blog post I'm sharing description of the Bloom filter, an algorithms of
basic operations and finally some maths behind probabilistic nature of the
filter.

Often code expresses more then hundred words, therefore I'll decorate
descriptions with C# code.


## Bloom filter

Basic Bloom filter implementation would be a data structure that satisfy the
following contract

```
public interface IBloomFilter<T>
{
    void Add(T item);
    bool ProbablyContains(T item);
}
```

Nothing fancy yet. One could easily write a wrapper for an array or hash set
that would meet this interface. What is different with Bloom filter is that it
can store much more data in the query set because it doesn't really store items
itself. How is it done? Let's take a look into the algorithm.

### Implementation



## Maths


## References

1. [Wiki](https://en.wikipedia.org/wiki/Bloom_filter)
2. [Basic implementation](https://github.com/dskrzypiec/bloom-filter)
