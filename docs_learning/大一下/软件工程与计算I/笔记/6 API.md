# 1. `ArrayList`
在 **Java** 中，**`ArrayList`** 是一个非常常用的 **集合类（Collection）**，属于 **`java.util` 包**，它本质上是一个 **可动态扩容的数组**。相比普通数组，它更灵活、更方便管理元素。

## 1. 核心特点

| 特性       | 描述                                   |
| -------- | ------------------------------------ |
| **动态大小** | 可以随时增加或删除元素，不需要预先定义长度                |
| **有序**   | 元素按插入顺序排列，可以通过索引访问                   |
| **可重复**  | 可以存放重复元素                             |
| **类型安全** | 支持泛型，如 `ArrayList<String>`，保证只存放指定类型 |

---

## 2. 和数组对比

| 方面     | 数组                | ArrayList                               |
| ------ | ----------------- | --------------------------------------- |
| **大小** | 固定                | 可动态扩展                                   |
| **操作** | 需要手动管理            | 内置方法：`add()`、`remove()`、`get()`、`set()` |
| **效率** | 访问快，插入/删除慢（需移动元素） | 随机访问快，插入/删除也快，但比链表删除中间元素慢               |

## 3. 常用方法
**首先要加上引用**
```java
import java.util.ArrayList;
```

**创建：**
```java
ArrayList<String> List = new ArrayList<String>();
//(此处后面的String也可以不写。因为前面写过一次)
ArrayList<String> List = new ArrayList<>();
```

**添加元素**
```java
list.add("Java");
list.add("Python");
```

**获取元素**
```java
String s = list.get(0); // "Java"
```

**修改元素**
```java
list.set(1, "C++");
```

**删除元素**
```java
list.remove("Java"); // 按元素
list.remove(0);      // 按索引
```

**遍历**
```java
for (String lang : list) {
    System.out.println(lang);
}
```

**大小**
```java
int size = list.size();
```

**检查是否为空集**
```java
boolean flag = list.isEmpty();
```

**检查是否包含某元素**
```java
boolean flag2 = list.contains("Java");
```

# 如何查找API？
参考书或网站可以找到