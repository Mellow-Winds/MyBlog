`String` 在 Java 里是 **reference type（类）**，但它拥有一整套 特殊的机制。
## 1 字符串常量池（String Pool）
Java 会把 **字符串字面量**放入 **String Pool**，相同内容只保存一份。

```java
String a = "hello";
String b = "hello";
```

内存：

```
a ─┐
b ─┘ → "hello" (String Pool)
```

结果：

```java
a == b   // true
```

因为 **指向同一个对象**。
## 2 `new String()` 会创建新对象

```java
String a = "hello";
String b = new String("hello");
```

内存：

```java
String Pool
   "hello"

Heap
   "hello" (new object)

a → pool object
b → heap object
```

结果：

```java
a == b      // false
a.equals(b) // true
```

规则：
> `new` **一定会创建新的对象**。
## 3 String 是不可变对象（Immutable）
一旦创建，内容不能改变。
```java
String s = "hello";
s = s + " world";
```
实际发生：
```
"hello"
"hello world"   ← 新对象
```
旧对象不会改变。
## 4 `==` vs `equals()`

比较字符串必须用：

```java
equals()
```
区别：

|方法|比较|
|---|---|
|`==`|地址|
|`equals()`|内容|
示例：
```java
String a = new String("hi");
String b = new String("hi");

a == b       // false
a.equals(b)  // true
```
## 5 编译期字符串优化
如果拼接的是 **常量**：
```java
String a = "he" + "llo";
```
编译器直接优化为：
```java
String a = "hello";
```
不会产生新对象。
## 6 变量参与拼接会创建新对象

```java
String a = "he";
String b = a + "llo";
```
JVM 实际执行：
```java
new StringBuilder()
    .append(a)
    .append("llo")
    .toString();
```
因此：
b的产生是创建新 String 对象。
## 7 `final` 变量 会触发编译期优化
```java
final String a = "he";
String b = a + "llo";
```
因为 `a` 是常量，编译器会优化为：
```java
String b = "hello";
```
所以：
```java
b == "hello"   // true
```
## 8 `intern()` 方法

`intern()` 可以把字符串放入 **String Pool**。

```java
String a = new String("hello");
String b = a.intern();
```

```
a → heap object
b → pool object
```

作用：

> 让字符串进入常量池。
## 9 String 的常见操作方法（可能会在后续继续补充）
常用方法：

```java
length()
charAt()
substring()
equals()
equalsIgnoreCase()
contains()
indexOf()
replace()
split()
toLowerCase()
toUpperCase()
```
示例：
```java
String s = "Hello";

s.length();      // 5
s.charAt(0);     // H
s.substring(1);  // ello
```
## 10 String 不适合频繁修改
因为 **每次修改都会创建新对象**：
```java
s = s + "a";
```
会产生大量对象。
解决方案：
```java
StringBuilder
StringBuffer
```
例如：
```java
StringBuilder sb = new StringBuilder();
sb.append("hello");
sb.append("world");
```

## 11 一个有意思的题目
```java
String a = "hello";
String b = "he" + "llo";
String c = "he";
String d = c + "llo";

System.out.println(a == b);
System.out.println(a == d);
```
结果：
``` java
true 
false
```
原因在上面应该阐述清楚了。
# 2 字符串的存储方法
Java中有两种存储字符串的方法：`Heap Object`和`pool Object`
## 1 堆对象（Heap Object）
**定义**：
- 通过 `new String()` 或运行期拼接创建的对象
- 存在 **堆（Heap）内存**
- 每次创建都是新的对象，有自己的地址
例子：
```java
String a = new String("hello");  // 堆对象
String b = a + " world";         // 堆对象（运行期拼接）
```
特点：

|特性|说明|
|---|---|
|地址|每次新创建，地址都不同|
|内容|可以和其他对象内容相同，但地址不同|
|`==`|比较地址，通常 false|
|`equals()`|比较内容，内容相同则 true|
## 2 常量池对象（Pool Object / String Pool Object）
**定义**：
- 字符串字面量 `"hello"`
- 编译期拼接得到的常量 `"he" + "llo"`
- 可以通过 `intern()` 将堆对象放入池
- 存在 **方法区 / 常量池**（JVM 特殊区域）
例子：
```java
String a = "hello";          // Pool object
String b = "he" + "llo";     // 编译期优化，Pool object
String c = a.intern();       // 如果 a 是 heap object，intern 会返回池对象
```
特点：

| 特性   | 说明               |
| ---- | ---------------- |
| 地址   | 相同内容只会有一个对象，地址相同 |
| 内容   | 相同内容指向同一个对象      |
| `==` | 比较地址，内容相同 → true |
| 优势   | 节省内存、提高性能        |

## 3 举例说明
```java
String a = "hello";            // pool object
String b = new String("hello"); // heap object
String c = b.intern();          // pool object

System.out.println(a == b); // false, 地址不同
System.out.println(a == c); // true, 指向 pool object
System.out.println(a.equals(b)); // true, 内容相同
```

# 3. String的方法
## 3.1 `s.charAt(k)`
可以以此找到第`k`个字符。
```java
String s = "Hello";
s.charAt(0);     // H
```