# 1.`print`函数
##  1.1 直接打印字符
```
print("Hello World")

print("你好")   #python也支持直接打印中文！
```
## 1.2 字符串连接打印
```
print("Hello" + "World" + "!")

Output：
HelloWorld!
```
## 1.3 单双引号转义
要打印有引号的内容，可否直接写
```
print("He said "Good!"")
```
不行，因为这样句子里面的引号会被当作print的结束，He said就结束了，后面还有，程序就会报错了
所以如何解决呢？？？
把双引号换成单引号就可以了
```
print('He said "Good!"')
```
或者外双内单也不会报错
那一句话里有单引号又有双引号咋办哩？
在引号前面加上**反斜杠**`\`即可~
```
print("He said \"Let\'s go!\"")
```

## 1.4 换行打印
同C语言，只要使用\n即可
```
print("Hello\nWorld")
```
## 1.5 三引号（''' or """)
使用三引号实现打印多行文字
```
print('''晓看天色暮看云
行也思君
坐也思君''')

Output:

晓看天色暮看云
行也思君
坐也思君
```
## 1.6打印数学结果
可以直接打印，无需引号
```
print(1)
print(2*3)
```
## 1.7 打印多次
```
print("六百六十六 " * 3)

Output:
六百六十六 六百六十六 六百六十六 
```
# 2.变量
## 2.1 变量的命名
- 不要数字开头
- 不要有空格（显然）
- 不要有引号（更显然）
## 2.2 变量的赋值
和C语言类似，只要变量后加上等号即可（注意有引号是赋值了一个“字符串”，无引号则是赋值了一个数字）
```
a = '2'         #把a赋值为"2"
```
和C语言类似，也可以把变量赋值给变量
```
b = a
```
## 2.3 实例：打印赋值的变量
```
a = '1'  
print("a")  
print("a" + a)  
print(a)
```
思考：会输出什么呢？
Output：
```
a
a1
1
```

诶🤓那这样呢？
```
a = 1 
print("a")  
print("a" + a)  
print(a)
```
测试一下🤯程序报错了！为什么？
因为这里赋值的是a=1，是一个数字，而print我们之前说过如果+a，那么a得是一个有引号的字符串！
这就是整数和字符串的区别。（注意：字符串不参与计算（好显然啊））
# 3.数学运算
## 3.1 基础的运算
加减乘除：和C语言相同此处不再赘述（PS：除法会直接输出为结果哦！）
```
print(1/3)

Output：
0.3333333333333333
```
此外还有Python独特的语言：
- `a**b`表示a的b次方
- `a//b`表示a和b的商向下取模的结果
## 3.2 其他更高级的数学运算：引入`math`函数
 注意：#include已经过时
 现在我们热切地投奔`import math`的怀抱！😍
 然后就可以使用`math.函数名`
 来使用函数（这倒是没有C语言方便hh🤣）（与此有关的是第14部分：模块）
 ```python
import math  
print(math.sin(1))
 ```
# 4.注释
## 如何添加注释？
使用#即可，前面的样例已经给出，此处不再赘述
```
a = '2'         #把a赋值为   '2'
```
## PyCharm快速改成注释
使用Ctrl+/即可。

# 5.Python的数据类型

| 类型         | 举例         |
| ---------- | ---------- |
| 字符串（str）   | “Hello”    |
| 整数（int)    | 6          |
| 浮点数(float) | 10.07      |
| 布尔类型(bool) | True/False |
| 空值         | None       |
| 列表         |            |
| 字典         |            |

## 5.1 字符串
需要有引号包裹
- 对字符串使用`len`函数可以得到字符串的长度
```
print(len('Hello'))

Output:
5
```
长度计算的规律：符号，空格，字母占1个长度，完整的转义符如``\n``占1个长度
- 提取某个位置的字符
```
print('Hello'[4])

Output:
o
```
注意：和C一样，顺序从0开始

## 5.2 整数和浮点数
之前提过，C语言课程也讲过，此处不予赘述了

## 5.3 Bool类型
返回值是`True`或者`False` (注意：是大写)

## 5.4 空值类型
表示完全没有值，可以先定义变量的值为None(注：同样需要大写)

## 5.5 返回类型
使用`type`函数实现返回类型，如：

```
print(type(6))

Output:
<class 'int'>   #返回的是整数int类型
```

# 6.Python的交互模式
可以直接执行指令，但是不会保存指令，适合做一些简单的指令比如一次性计算

# 7.`input`函数

## 7.1 标准形式
```
text = input("请输入文本：")
```

这个语句把用户输入的内容放在了text变量中
```
text = input("请输入文本：")
(输入13)
print(text)

Output：
13
```

注意：input返回值一律是字符串，哪怕输入数字也会变成字符串，如果要使用数字还需要转换一下，如何转换呢？使用`int`直接可以转换成整数，同理`float` `str` 等也可以

## 7.2 实例1：计算年龄
```
age = int(input("请输入你的年龄："))
age_after_ten_years = age + 10
print("您十年后是" + str(age_after_ten_years) + "岁")

Input:
13
Output:
您十年后是23岁
```
# 8.条件的判断
## 8.1 `if`条件语句的基本格式
```
if 条件 :
   (有缩进)条件为真则执行的语句
else :
   (有缩进)条件为假是执行的语句
```

例1：比大小
```
a = int(input("a="))  
b = int(input("b="))  
if a>b:
   print("Max is a: " + str(a))  
else:
   print("Max is b: " + str(b))
```

## 8.2 嵌套条件语句
形如：
```
if a:  
    if b:  
        xxx
```
的是嵌套条件语句，表示a和b都满足时的做法
条件的满足基于缩进判断，而不是如C语言一样使用括号里面嵌套括号的做法。

## 8.3多条件判断
不同于C语言，Python使用`elif`判断多条件
```
if a :  
    xxx  
elif b :  
    xxx  
else c :  
    xxx
```

同C语言一样，python只会执行第一个满足的条件下面的语句

## 8.4 逻辑运算
python只有三个逻辑运算：`and,or,not`
对应：与，或，非
`a and b`：都满足
`a or b`：有一个满足
`not b`：只要b不满足（只对一个对象操作，操作是反转原先的Bool值，`True`返回`False`）
可以使用括号来改变计算的顺序

# 9.列表
## 9.1 简单的介绍
Python中的列表用名字和方括号来制造
`list=[]`表示一个空列表
`list=["1","2"]`表示有元素`1,2`列表
## 9.2 一些常见的针对列表的方法和函数
- 使用`append方法`向列表中加入数据`list.append("3")`以加入`3`到`list`中
- 使用`remove方法`从列表中删除数据`list.remove("2")`以删去`2`
- 使用`print`打印列表：`print(list)`
- 使用`len`函数获得列表中元素的个数
- 使用索引`[]`找到列表中的元素或对该位置的元素重新赋值
- 使用`max,min`函数打印最大/最小值
- 使用`sorted`函数实现排序
- 使用`list.pop(index)`
  **作用**：删除列表中指定索引的元素，并返回这个元素
  **如果不写 index**，默认删除 **最后一个元素**
  示例：
```python
nums = [10, 20, 30]
x = nums.pop()   # 删除 30
print(x)         # 30
print(nums)      # [10, 20]
y = nums.pop(0)   # 删除第 0 个元素
print(y)          # 10
print(nums)       # [20]
```


---------------------------------
## 9.3 题外话：方法和函数的区别
- 方法：
基本格式是`对象.方法名(...)`
- 函数：
基本格式是`函数名(对象)`
---------------------
## 9.4 可变和不可变的变量
提示：`list`和其他变量不同的是，它是可变的变量。每一次操作都是针对变量本身进行的。
什么是可变的？
我们用`upper`方法来阐释
```
s= "Hello"
print(s.upper())
print(s)
s=s.upper()
print(s)

Output:
HELLO
Hello
HELLO
```
一句话总结：我们的第一步操作都是针对字符串变量`s`进行的，但是并没有改变`s`本身，所以`s`是不可变的。不可变的变量赋值需要`=`，就像后面那样我们重新赋值`s`才改变了它。但是可变变量的操作都是基于变量本身的，操作完了以后就会改变变量本身。

# 10.字典
字典用于储存键值对
标准写法：
```
contacts = {"A" : "a",
            "B" : "b" }等等
```
获取键值：
```
contacts["A"]
contacts[x]，x是一个字符串等
```

元组(tuple)（注意：不可变）
```
example_tuple=("A","B")
注意区分于列表：
example_list=["A","B"]
```
可以把元组作为键，查找对应的键值
添加或者更新键值对：
```
contacts["C"(键)]="c"(值)
```
删除键值对：
```
del contacts["A"]
```
判断键是否存在于字典：
```
使用
"A" in contacts
如果存在则返回true
可以通过以下print函数验证这一点
print("A" in contacts)
```
获取键值对的对数：
```
len(contacts)
```
`字典名.key`返回所有键
`字典名.values`返回所有值
`字典名.items`返回所有键值对
# 11.循环
## 11.1 `for`循环
标准格式：
`for 变量名 in 可迭代对象:`

for和range一起用：
```python
for i in range(2,10,2):  
    print(i)

Output:
2
4
6
8
```
表示从5开始，以步长为2打印数字（注意：终止值10不在range之内）

## 11.2 `while`循环
标准格式：
```python
while A:
    B
```
适用于条件结果未知时。
# 12.格式化字符串
## 12.1 `format()` 函数
`format`函数是 Python 中用于格式化字符串的一个常用方法。它允许你插入变量到字符串中，支持更复杂的格式化操作。
基本语法是：
```python
"字符串{}".format(变量)
```
### 1.**基本用法**
```python
name = "Alice"
age = 30
print("My name is {} and I am {} years old.".format(name, age))

Output:
My name is Alice and I am 30 years old.
```
### 2.**指定位置的参数**
可以通过在花括号中指定索引来明确指定参数的位置：
```python
print("My name is {0} and I am {1} years old. {0} likes coding.".format(name, age))
```
输出：
```python
My name is Alice and I am 30 years old. Alice likes coding.
```
在花括号 `{}` 中，可以指定数字（例如 `{0}`, `{1}`）来表示 `format()` 函数传入的参数在字符串中的位置。这里的 `0` 和 `1` 是参数的位置索引，从 `0` 开始。
### 3.**命名参数**
还可以通过命名参数来传递变量：
```python
print("My name is {name} and I am {age} years old.".format(name="Bob", age=25))
```
输出：
```python
My name is Bob and I am 25 years old.
```
### 4.**格式化数字**
`format()` 可以用来格式化数字（例如浮点数的精度，整数的填充等）。
```python
# 控制浮点数的小数位数
pi = 3.14159265358979
print("Pi is approximately {:.2f}".format(pi))

输出：
Pi is approximately 3.14
```
### 5. **对齐和宽度设置**
可以指定字符串的最小宽度，并且可以选择左对齐、右对齐或居中对齐。
```python
name = "Alice"
print("{:<10} | {:>10} | {:^10}".format(name, age, pi))
```
输出：
```
Alice      |        30 |    3.141593
```
- `:<10` 表示左对齐并填充到 10 个字符宽度。
- `:>10` 表示右对齐并填充到 10 个字符宽度。
- `:^10` 表示居中对齐并填充到 10 个字符宽度。
### 6. **使用`f-string`（Python 3.6+）**
从 Python 3.6 开始，还可以使用 f-string，它比 `format()` 更简洁高效：
```python
name = "Alice"
age = 30
print(f"My name is {name} and I am {age} years old.")
```
`f-string` 直接嵌入了变量，使用起来更加简洁。
`format()` 在更复杂的格式化需求下仍然非常有用，尤其是在处理多种格式和宽度时。
# 13.函数
基本格式
```python
def function_name(parameters):
    执行的代码
    return value  #可选，返回一个值
```
其他内容还在探索中...
# 14.模块
### 1. **导入整个模块**
可以使用 `import` 关键字来导入整个模块，导入后使用 `模块名.函数名` 来访问模块中的内容。
**语法：**
```python
import module_name
```
**示例：**
```python
import math  # 导入math模块
print(math.sqrt(16))  # 使用math模块中的sqrt函数
```
输出：
```
4.0
```
### 2. **从模块中导入一个特定函数或变量**
可以选择只导入模块中的某些部分（函数、变量等），而不是整个模块。
**语法：**
```python
from module_name import function_name
```
**示例：**
```python
from math import sqrt  # 只导入sqrt函数
print(sqrt(16))  # 直接使用sqrt函数，无需模块名前缀
```
输出：
```
4.0
```
### 3. **导入模块并重命名**
可以使用 `as` 关键字来给导入的模块或函数起个别名，方便在代码中使用。
**语法：**
```python
import module_name as alias_name
```
**示例：**
```python
import math as m  # 给math模块起个别名m
print(m.sqrt(16))  # 使用别名m来访问sqrt函数
```
输出：
```
4.0
```
### 4. **从模块中导入多个函数或变量**
可以一次性导入多个函数或变量，用逗号隔开。
**语法：**
```python
from module_name import function1, function2
```
**示例：**
```python
from math import sqrt, pi  # 导入sqrt和pi
print(sqrt(16))  # 输出4.0
print(pi)  # 输出3.141592653589793
```
### 5. **导入模块中的所有内容**
使用 `*` 可以一次性导入模块中的所有函数、变量和类。但这种方式并不推荐使用，因为它会导入所有内容，可能会导致命名冲突。
**语法：**
```python
from module_name import *
```
**示例：**
```python
from math import *  # 导入math模块的所有内容
print(sqrt(16))  # 直接使用sqrt函数
print(pi)  # 直接使用pi常量
```
### 6. **导入自定义模块**
如果有自己写的 Python 文件（模块），比如 `my_module.py`，你可以使用 `import` 来导入它，前提是该文件在当前工作目录中或 Python 的路径中。
**示例：**
假设有一个文件 `my_module.py` 内容如下：
```python
# my_module.py
def greet(name):
    print(f"Hello, {name}!")
```
可以在其他 Python 文件中导入并使用它：
```python
import my_module  # 导入自定义模块
my_module.greet("Alice")  # 调用my_module中的greet函数
```
输出：
```
Hello, Alice!
```
### 7. **模块的搜索路径**
Python 会在一定的路径列表中搜索模块，主要包括：
- 当前目录。
- 标准库路径。
- 安装的第三方包路径（如 `site-packages`）。
可以通过 `sys.path` 查看这些路径：
```python
import sys
print(sys.path)
```
如果你想让 Python 找到一个自定义的模块，可以将其路径添加到 `sys.path`。
### 8. **`__name__` 和模块执行**
当 Python 文件作为模块导入时，模块中的代码不会立即执行；只有在直接运行该模块时，代码才会执行。如果你希望某些代码仅在模块被直接运行时执行，可以使用以下方式：
```python
if __name__ == "__main__":
    # 只有直接运行这个文件时，以下代码才会执行
    print("This module is being run directly!")
```
# 15.元组
## **一、什么是元组（tuple）？**
**元组 = 不可修改的列表**
写法用小括号 `()`：
```python
t = ("Alice", 85)
```
特点：
- 有顺序（可索引）
- 可以存不同类型的值
- **不能修改**（与 list 的最大区别）
## **二、元组的顺序是怎样的？**
像列表一样，有索引：
```python
t = ("Alice", 85, "Class 3")
```
索引对应：
```
t[0] → "Alice"
t[1] → 85
t[2] → "Class 3"
```
## **三、如何按元组的“某个位置”排序？**
假设有一个元组列表：
```python
a = [
    ("Alice", 85),
    ("Bob", 92),
    ("Charlie", 78)
]
```
### 🔸 按第 1 个值排序（名字）
```python
a.sort(key=lambda x: x[0])
```
### 🔸 按第 2 个值排序（成绩）
从大到小排：
```python
a.sort(key=lambda x: x[1], reverse=True)
```
从小到大排：
```python
a.sort(key=lambda x: x[1], reverse=False)
```
## **四、如何输出元组的某个值？**
还是用索引：
```python
t = ("Alice", 85)

print(t[0])  # 输出 Alice
print(t[1])  # 输出 85
```
从元组列表里取值：
```python
print(a[0][1])
```
解释：
- `a[0]` → 第一个元组 → ("Alice", 85)
- `a[0][1]` → 这个元组的第二个值 → 85
## 五、如何存入元组？
多个元素：
```python
n = int(input())
data = []

for _ in range(n):
    a, b = input().split()
    data.append((a, int(b)))
```