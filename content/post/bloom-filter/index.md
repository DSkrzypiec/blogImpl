---
date: "2021-10-08"
tags: ["Data Structures", "C#"]
title: "Bloom filter"
toc: false
draft: false
markup: "goldmark"
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
itself. Just to clarify - if `ProbablyContains` method return `false` we know
**for sure** that given `item` does not exists in the set. The probabilistic
part lays in another case, then we can only say that it **could** be in the set
but not certainly.

How is it done? Let's take a look into the algorithm.

### Implementation

Implementation starts from a bit (I'll use bytes in C# codes) array and a bunch
of hash functions.

```
public class BloomFilter<T> : IBloomFilter<T>
{
    private byte[] _bitset;
    private IList<Func<byte[], byte[]>> _hashFunctions;
    ...
}
```

That's all regarding the state of Bloom filter. The filter is initially
constructed with all elements of `_bitset` set to `0` but more about
`BloomFilter<T>` constructor later, including size of `_bitset` and number of
`_hashFunctions`.

The essence of the algorithms lays in the implementation of `Add` and
`ProbablyContains` methods.


#### `Add` method

For given `T item` method `Add` do the following:

1. Calculate all hashes of `item` using hash functions from `_hashFunctions`
1. Transform calculated hashes into `_bitset` indices
1. For obtained indices set values of `_bitset` to `1`

Basic C# version can be implemented as follows

```
public void Add(T item)
{
    var bytes = ObjectToByteArray(item);

    for (var i = 0; i < _hashFuncs.Count; i++) {
        var idx = GetIdFromHash(_hashFuncs[i](bytes));

        if (_bitset[idx] == 0) {
            _bitset[idx] = 1;
        }
    }
}

```

OK, so we start from zeroed array and within another `Add`s more bits will be
set to one. Ones are cumulated and couldn't be set to zero. At least in the
original Bloom Filter version. In another words - we cannot delete items from
the set.

Adding elements seems to be rather trivial but on the other hand displays
the main idea behind Bloom Filter. Instead of storing objects itself in the
data structure we'll just flip few bits in constant-size-array based on
the results of independent hash functions called on the object.


#### `ProbablyContains` method

For given `T item` method `ProbablyContains` do the following:

1. Calculate all hashes of `item` using hash functions from `_hashFunctions`
1. Transform calculated hashes into `_bitset` indices
1. If at least one value based on calculated indices is zero then `false` is
   returned and `true` otherwise

C# version can looks like this

```
public bool ProbablyContains(T item)
{
    var bytes = ObjectToByteArray(item);

    for (var i = 0; i < _hashFuncs.Count; i++) {
        var idx = GetIdFromHash(_hashFuncs[i](bytes));

        if (_bitset[idx] == 0) {
            return false;
        }
    }

    return true;
}
```

Once again an algorithm is straightforward but why does it work and why is it
probabilistic?

Let's focus on negative case. We've calculated all of the hashes for given item
and transformed those into indices. We found out that for one of indices value
in `_bitset` is zero. This means that all elements that were added to Bloom
Filter and all of their hashed-deduced indices never hit this spot. So this
must be a new element. Therefore we have got proof by contradiction.

On the other hand when all values of `_bitset` for hash-deduced indices are set
to one we still cannot say for sure that given element exists in the Bloom
Filter. Why is that? The most probable case for false-positive is when parts of
hit bits were set based on `item_n` and the rest of the bits were set based on
`item_m`. Still all required bits are ones but we cannot say that those bits
were activated by single object.


## Maths

At this point we know why the answer is probabilistic but it's not merely
enough. I'd like to know what is the probability of false positive and how it
is related with `_bitset` size. Let's find out.

False positive in this context means that `ProbablyContains(x) == true` and `x`
is not contained in the search set which is equivalent to the fact that at
least one bit checked for `x` wasn't set to one by `x`.
Using assumption about uniform distribution of hash functions and independence
of hash function we can determine probability of described event


$$ P(A) = \left( 1 - \frac{1}{m} \right)^{k}$$

Where `A` is an event of that particular bit is not set to one by any of `k`
hash functions and `m` is size of `_bitset`. Once again, by independence, event
`B` which is the same as `A` but after `n` inserts can be expressed as

$$ P(B) = \left( 1 - \frac{1}{m} \right)^{k \cdot n} $$

Finally we can write approximation for a probability of false positives

$$ P(FP) = \left( 1 - \left( 1 - \frac{1}{m} \right)^{m \cdot \frac{k \cdot n}{m}} \right)^{k} \approx 
\left( 1 - e^{-\frac{k \cdot n}{m}} \right)^{k}  $$

The above approximation says that the probability of false positives

1. decreases with growth of `_bitset` size
1. increases with number of insertions
1. decreases with number of hash functions, but requires more computations

The probability function for false positives can be perceived as functions of
__k__ (number of hash functions) assuming that __m__ and __n__ are given
constants. In this case we can easily calculate optimal number of hash
functions by minimizing false positives function. It's a
differentiable function so we can use standard methods from calculus.
The number of hash functions that minimizes false positives is

$$ k_{opt} = \frac{m}{n} \ln 2 $$

That's cool! We can a priori choose number of hash functions by estimating
`_bitset` size and number of insertions.


## Summary

There are [many variations](https://www.dca.fee.unicamp.br/~chesteve/pubs/bloom-filter-ieee-survey-preprint.pdf)
of Bloom filters including ones with deletion capibilities but the most
fascinating to me was the original idea. Very clever usage of properties of
hash functions to significantly reducees memory usage and disk reads.


## References

1. [Original paper](https://www.cs.princeton.edu/courses/archive/spr05/cos598E/bib/p422-bloom.pdf)
1. [Wiki](https://en.wikipedia.org/wiki/Bloom_filter)
1. [Basic implementation](https://github.com/dskrzypiec/bloom-filter)
1. [Variations of Bloom filters](https://www.dca.fee.unicamp.br/~chesteve/pubs/bloom-filter-ieee-survey-preprint.pdf)
