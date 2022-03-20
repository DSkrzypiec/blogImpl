---
date: "2022-03-13"
tags: ["Data engineering", "CLI"]
title: "AWK - forgotten data engineering tool"
toc: false
draft: false
---

## Intro

This post is dedicated to [AWK](https://en.wikipedia.org/wiki/AWK). Despite the
title AWK is not totally forgotten but still many data scientists and engineers
have never heard of it. Since 1977 many things have changed in the data world,
especially the scale, but in my opinion it's still relevant and useful tool in
2022.


## What is AWK

AWK is a tiny, domain-specific language for text processing. It can be used via
`awk` program which is usually available on UNIX-like systems out of the box. From
this point on I'll use AWK as the reference to the language and the program.

AWK was designed and developed by three office mates in Bell Labs in 1970s -
Alfred **A**ho, Peter **W**einberger and Brian **K**ernighan. It was released
in 1977! 45 years ago! How many IT tools from over 40 years ago do you use?  I
guess not many. Why would anyone should use tool that old? Isn't there any
better alternatives nowadays? Basically no. I think mentioned authors solved
very generic problem using simple and beautiful design. There is very little to
improve in term of design and high level aspects.

For someone who has never used AWK it's probably still not clear what AWK
does, so let's focus on this point.


## How AWK works

AWK basically scans input (from standard in or a file) line by line and perform
some action on fields (data separated by given separator). Actions might be
conditioned on patterns. There is already few characteristics of a general
problem that AWK is designed to solve:

1. Structured data with known separator
1. Processing data from input line by line
1. Using pattern matching for actions


AWK script is composed of the beginning, list of rules and the ending.

```
# AWK script in file simple.awk

BEGIN { print "Hello!" }
$1 > 0 { print "Positive" }
$1 == 0 { print "Zero" }
$1 < 0 { print "Negative" }
END { print "End!" }
```

The above AWK script will goes line by line from the input and start to apply
rules for each line. In our scripts we have three rules - all based on value of
the first field `$1`. Based on the first field value appropriate code block
will be executed. Furthermore we have `BEGIN` and `END` clause. Their code
blocks will be executed **once** at the beginning and end of processing.
Clauses `BEGIN` and `END` are optional.

For example (flag `-f` states that script would be applied)

```
echo "42\n-10\n0" | awk -f simple.awk
```

will produce the following output:


```
Hello!
Positive
Negative
Zero
End!
```

As we saw in previous example we can refer to field using `${number}` notation.
Also `$0` means the whole line. In particular one of simplest AWK usages for
printing the file can be written as

```
awk '{ print $0 }' file.txt
```

We also have (for each line) variables like `NR` - number of current row and
`NF` - number of fields in the current row. Immediate use of this can be
validation whenever the file contains 4 columns in every row:

```
awk -F ';' 'NF != 4 { print $0 }' file.txt
```

Flag `-F` specify the separator. The above example will print every line in
`file.txt` with number of columns different from 4.

More examples will come in next chapters. For now we'll be focused only on the
main idea and mechanism of AWK.

## When AWK might be useful

* You have to perform data manipulation or validation on file that doesn't fit
  into RAM
* You want to perform some data manipulation within \*NIX pipeline (where input
  is output of another program)
* You want to perform data checks after export into flat file
* You've got raw database dump in form of a file and want to look into it
  quickly

I even read of some uses of AWK in production using scripts with over 1k lines
of codes. In my opinion it might a be a bit of exaggeration.


## One-liners

Here you can find few one-liners used by myself most often with AWK.

### Number of columns (fields) validation

```
awk 'NF != 4 { print $0 }' file.txt
```

For each line `number of fields is not equal to four` rule is checked. If this
case happen, than the program will print the whole row using `$0`. Otherwise
there is no action. So if all rows in the `file.txt` would have four columns,
than the above command should return nothing.


### Sum of values from given column

```
awk '{ sum += $3 } END { print sum }' file.txt
```

For each line variable `sum` will be incremented by value from third field.
After all rows are processed `sum` variable will be printed.

### Count distinct values

```
awk '
    { cnt[$1]++ }
    END {
        for (x in cnt) printf "%s: %d\n", x, cnt[x]
    }' file.txt
```

In this case for each row map (dictionary) variable `cnt` will increment value
for key based on value from the first field. After all lines are processed we
will iterate over the `cnt` map and prints its keys and values.


## Summary

In my opinion AWK is just brilliant. Remarkable, timeless and simple design.
From my experience AWK has the highest return on investment from all IT tools
I've learned. One can easily learn AWK in 1-2 hours and its applications are
really wide, especially if you work with data at some level. Even if you don't
really work with data but you do use UNIX-like terminal than also you should
find AWK very useful.


PS. There is a recording on YouTube of the talk between Lex Fridman and Brian
Kernighan. I highly recommend it - really interesting.
[Link](https://youtu.be/O9upVbGSBFo?t=2121).


## References

1. [Wiki](https://en.wikipedia.org/wiki/AWK)
1. [The GNU Awk User's Guide](https://www.gnu.org/software/gawk/manual/gawk.html)

