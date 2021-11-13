---
date: "2021-11-13"
tags: ["Database", "T-SQL", "C#"]
title: "Parsing T-SQL"
toc: false
draft: false
---

![img](introPic.png)

## Intro

Once I've tried to implement auto formatter for T-SQL. To make this there seems to
be two ways. The first and easier one is to implement sets of rules to
transform text file without any context. The other one is to base on
[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of T-SQL and use its
context to apply formatting. The first case seems to be easier at the beginning
and can be gradually extended but it's really hard and dirty to include all of
the cases without the knowledge of the context. So I thought the right way is
to use abstract syntax tree.


## Implementing a parser

Roughly about two years ago I couldn't find a library containing lexer and
parser for T-SQL so I've chosen to write my own parser of T-SQL. By the way, I
haven't really write a parser ever before so I treated it as a nice opportunity
to learn.

The whole idea of creating code auto formatter came from Go language with such
a tool. Obviously I looked into implementation of [Go's
parser](https://github.com/golang/go/blob/master/src/go/parser/parser.go).

I very liked this implementation, clean and simple. In similar way I've
implemented a lexer (scanner) and started to implement a parser.
I've wrapped around implementation of core mechanism but I didn't have enough
motivation and time to implement fully-fledge parser for T-SQL. It has stalled and
I have leaved the project behind.


## Oh, there is a library

Very recently I've discovered
[Microsoft.SqlServer.TransactSql.ScriptDom](https://docs.microsoft.com/en-us/dotnet/api/microsoft.sqlserver.transactsql.scriptdom?view=sql-dacfx-150)
library. Unfortunately it is no __yet__ open source (on the publishing date)
according to [this
discussion](https://github.com/microsoft/sqltoolsservice/issues/973). You can
find a NuGet package
[here](https://www.nuget.org/packages/Microsoft.SqlServer.TransactSql.ScriptDom).

The library contains functionality for parsing, transforming and generating AST
of T-SQL. That sounds great. How come I haven't found it back 2 years ago? In
my opinion it is not easy to find. It might be a bit easier after 2020 when
[this blog post](https://devblogs.microsoft.com/azure-sql/programmatically-parsing-transact-sql-t-sql-with-the-scriptdom-parser)
was written.

The API of the library is pretty convenient. The basic example of use to get an
AST based on given SQL script path goes as follows

```
using (TextReader str = new StreamReader(sqlFilePath)) {
    var parser = new TSql150Parser(true, SqlEngineType.All);
    var tree = parser.Parse(str, out var errors);
    ...
}
```

An AST is in form of `TSqlFragment`. In order to traverse the parsed AST 
[visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern) can be used
via `TSqlFragment.Accept` method. In order to do that one have to implement a
class which inherits from `TSqlFragmentVisitor`. It has many overloads (2005 in
total) for `ExplicitVisit` and `Visit` methods for different nodes of AST.


```
public abstract class TSqlFragmentVisitor
{
    protected TSqlFragmentVisitor();

    public virtual void ExplicitVisit(FederationScheme node);
    public virtual void ExplicitVisit(CreateTableStatement node);
    public virtual void ExplicitVisit(ConstraintDefinition node);
    public virtual void ExplicitVisit(ColumnStorageOptions node);
    ... // 2005 overloads for two different methods of different type of nodes
    public virtual void Visit(ExecuteInsertSource node);
    public virtual void Visit(AlterDatabaseAddFileGroupStatement node);
}
```

As example let's take a look for visitor which finds all `DROP TABLE`
statements and prints a warning. In this case `MyVisitor` would looks like the
following

```
public class MyVisitor : TSqlFragmentVisitor {
    public override void ExplicitVisit(DropTableStatement stm) {
        var objects = stm.Objects;
        if (objects.Count > 0) {
            foreach (var obj in objects) {
                var msg = $"You try to DROP {obj.BaseIdentifier.Value} " +
                    $"in line: {obj.StartLine} col: {obj.StartColumn}";
                Console.WriteLine(msg);
            }
        }
        base.ExplicitVisit(stm);
    }
}
```

Finally it can be applied via `Accept` method.


```
using (TextReader str = new StreamReader(sqlFilePath)) {
    var parser = new TSql150Parser(true, SqlEngineType.All);
    var tree = parser.Parse(str, out var errors);
    tree.Accept(new MyVisitor());
}
```

Full running example can be found
[here](https://github.com/DSkrzypiec/blogSourceCodes/tree/master/202111_ParsingTSQL/sqlParser).

Another simple and really easy example of using T-SQL parser is
[this example](https://michaeljswart.com/2014/04/removing-comments-from-sql)
for removing all comments from T-SQL script.


## ANTLR


## Summary


## References

1. [github.com/DSkrzypiec/mssfmt](https://github.com/DSkrzypiec/mssfmt)
2. [Microsoft SQL Server Script DOM](https://www.dbdelta.com/microsoft-sql-server-script-dom/)
3. [Another Microsoft blog post](https://devblogs.microsoft.com/azure-sql/programmatically-parsing-transact-sql-t-sql-with-the-scriptdom-parser/)

