---
date: "2019-08-20"
tags: ["stats", "R", "go"]
title: "What the quantile really is?"
draft: false
markup: "mmark"
---

## Intro
So what is a quantile? It's a [statistic](https://en.wikipedia.org/wiki/Statistic) 
so it gives us aggregated information
about some data sample. For example let's say we have data sample representing
salary of employees of some company. Quantile can gives us answer on question
"How much should I be paid to earn more then 90% of employees?". Let's say
sample is 

$$ S = \lbrace 140, 80, 70, 200, 100 \rbrace $$

How would you answer the question for this sample? Probably by sorting salaries

$$ 70, 80, 100, 140, 200 $$

and the answer would be somewhere between $$140$$ and $$200$$. But where?


## A bit of maths
Formally if $$X$$ is random variable with distribution $$P$$ and $$p \in \lbrack
0, 1 \rbrack$$, then **p-quantile** is value $$x_p$$ of X which satisfy the
following two inequalities

$$
P(X \le x_p) \ge p \\
P(X \ge x_p) \ge 1 - p
$$

But in real-world (statistics) we often don't know the real form of CDF of given
sample. More interesting question is "how quantile is calculated".

## How it's calculated?
Statistics gives us an *estimator* for calculating quantile. This
estimator also use [order statistics](https://en.wikipedia.org/wiki/Order_statistic) 
of a sample. General form of p-quantile estimator $$\hat{Q}(p)$$ which is used
in statistical software is as follows

$$
\hat{Q}(p) = (1 - \gamma(p))X_{(j)} + \gamma(p) X_{(j+1)}
$$

where $$X_{(j)}$$ is j-th order statistics of sample $$x$$, $$0 \le \gamma(p) \le
1$$ and 

$$
\frac{j - m}{n} \le p \le \frac{j - m - 1}{n}
$$

where $$n$$ is sample size.

{{% note %}}
So this estimator is excactly the same as our intuition from the beginning. It
is somewhere between j-th and (j+1)-th ordered elements. 
{{% /note %}}

**But where exactly?** As it turns out there is not a good answer. Obviously we
need some kind of interpolation with property $$Q(p) \ge Q(q)$$ if $$p \ge q$$.
This interpolation is mainly needed for small samples. If in our case sample had
size of $$100$$ then $$0.90$$ quantile would be 90-th sorted element of the
sample but in our five elements sample we cannot give specific answer without
interpolation.
In paper [Sample Quantiles in Statistical
Packages](https://www.amherst.edu/media/view/129116/original/Sample+Quantiles.pdf) 
by Rob T. Hyndman and Yanan Fan there is summary of nine methods of interpolation 
defined in various statistical software. 

Here we focus only on one specific method - default method from **R** 
programming language, from function `quantile` - `type = 7`. In this case 
$$j = \lfloor p(n - 1) + 1 \rfloor$$ and function $$\gamma(p)$$ is of the form

$$
\gamma(p) = p(n - 1) + 1 - \lfloor p(n - 1) + 1 \rfloor
$$

Now we can calculate 0.90-quantile of our five-element sample - $$n = 5$$ and
$$p = 0.9$$. As we thought the answer lay somwhere between $$140$$ and $$200$$
now it is cofirmed by above formulas - $$j = \lfloor 0.9 \cdot 4 + 1 \rfloor =
\lfloor 4.6 \rfloor = 4$$. Futhermore $$ \gamma(0.9) = 4.6 - 4 = 0.6$$. Finally
we can compute 

$$
\hat{Q}(0.9) = (1 - \gamma(0.9))X_{(4)} + \gamma(0.9)X_{(5)} = \\ 
(1-0.6) \cdot 140 + 0.6 \cdot 200 = 176.0
$$

So using default R method for calculating quantile we should expected final
result as $$176$$. 

```R
quantile(x = c(70, 80, 100, 140, 200), probs = 0.90)
```

Figure `1` presents how function $$\gamma(p)$$ interpolates between sample points.
One can observe that interpolation is linear between nodes. It seems like
reasonable method of interpolation.

{{< figure
img="SalaryQuantilePlot.jpg" 
caption="Quantile plot for salaries sample to present how interpolation looks like in this case." 
command="Resize" 
options="700x" >}}

## Go implementation

**TODO:** describe go implementation

```go
func Quantile(x []float64, prob float64) float64 {
	if prob < 0.0 || prob > 1.0 || math.IsNaN(prob) || math.IsInf(prob, 0) {
		return math.NaN()
	}
	newX := sort.Float64Slice(x)
	newX.Sort()

	if prob == 1.0 {
		return newX[len(newX)-1]
	}

	j := qj(x, prob)
	gpVal := gp(x, prob)
	quantile := (1.0-gpVal)*newX[j] + gpVal*newX[j+1]

	return quantile
}
```

## R vs go benchmark

**TODO:** perform benchmark and possibly check way R implementation in C is
slower.

## Summary
