# 60：是否为子序列
## 题目:  
给定字符串s和字符串t，判断s是否为t的子序列。  
子序列：在原序列中删除某些字母（可以不删），不改变剩余的字母的相对顺序生成的序列。  
s和t都只包含小写字母。  
```
输入:s=abc t=ahbgdc  
输出：true  
  
输入:s=acb t=ahbgdc  
输出：false  
  
输入:s=axc t=ahbgdc  
输出：false
```

## 解答：使用双指针
```java
public class IsSubsequence {
    public static boolean isSubsequence(String s, String t) {
        int i = 0, j = 0;
        // 核心：在访问 charAt 之前，必须保证索引小于 length
        while (i < s.length() && j < t.length()) {
            if (s.charAt(i) == t.charAt(j)) {
                i++; // 只有匹配了，s 的指针才前进一步
            }
            j++; // 无论是否匹配，t 的指针都要后移
        }
        // 最终状态：如果 i 走到了 s 的末尾（等于长度），说明全部匹配成功
        return i == s.length();
    }
}
```

# 62：完全数
## 题干：
分别完成两个方法，判断输入的正整数是不是一个 perfect number 或 deficient number  
### `perfect number`
如果一个数的所有除数（除了自己以外）的和正好等于这个数，则它就是一个 perfect number。  
比如数字  6 的除数有 1，2，3，加起来等于 6，那么 6 就是一个 perfect number。  
  
### `deficient number`
如果一个数的所有除数（除了它自己以为）的和小于这个数，那么这个数就是一个 deficient number。  
比如数字 10 的除数有 1，2，5，加起来等于 8，那么 10 就是一个 deficient number。

## 解答：应该算很容易？
```java
public class PerfectAndDeficientNumbers {  
  
    public static boolean isPerfect(int posInt) {  
        int sum = 0;  
        for (int i = 1; i < posInt; i++) {  
            if (posInt % i == 0) {  
                sum += i;  
            }  
        }  
        return sum == posInt;  
    }  
  
    public static boolean isDeficient(int posInt) {  
        int sum = 0;  
        for (int i = 1; i < posInt; i++) {  
            if (posInt % i == 0) {  
                sum += i;  
            }  
        }  
        return sum < posInt;  
    }  
}
```

# 63：奇偶排序

## 解答：使用双数组+`ArrayList`
```java
import java.util.ArrayList;  
  
public class ReOrderArray {  
    public int[] reOrder(int[] array) {  
        ArrayList<Integer> odd = new ArrayList<>();  
        ArrayList<Integer> even = new ArrayList<>();  
        for (int i : array) {  
            if (i % 2 == 0) {  
                even.add(i);  
            } else {  
                odd.add(i);  
            }  
        }  
        int[] result = new int[odd.size() + even.size()];  
        for (int k = 0; k < odd.size(); k++) {  
            result[k] = odd.get(k);  
        }  
        for (int k = odd.size(); k < odd.size() + even.size(); k++) {  
            result[k] = even.get(k - odd.size());  
        }  
        return result;  
    }  
  
}
```
可能有更好的方法？

# 59：求两个数组的子集
## 题目:  
找出两个数组相同的部分，且结果不含重复元素  

## 正确解答1
我一开始的代码是遍历：
```java
import java.util.ArrayList;  
  
public class IntersectionOfTwoArrays {  
    public static int[] intersection(int[] nums1, int[] nums2) {  
        ArrayList<Integer> result = new ArrayList<>();  
        for (int i : nums1) {  
            for (int j : nums2) {  
                if (i == j) {  
                    if (!result.contains(i)) {  
                        result.add(i);  
                    }  
                }  
            }  
        }  
        int[] arr = new int[result.size()];  
        for (int i = 0; i < result.size(); i++) {  
            arr[i] = result.get(i);  
        }  
        return arr;  
    }  
  
}
```
时间复杂度来到了惊人的$O(n \cdot m \cdot k)$（竟然过了，也是神了）
于是尝试使用HashSet解决问题：
## 正确解答2

```java
import java.util.HashSet;
import java.util.Set;

public class IntersectionOfTwoArrays {
    public static int[] intersection(int[] nums1, int[] nums2) {
        Set<Integer> set1 = new HashSet<>();
        for (int n : nums1) set1.add(n);

        Set<Integer> resSet = new HashSet<>();
        for (int n : nums2) {
            if (set1.contains(n)) {
                resSet.add(n);
            }
        }
        int[] arr = new int[resSet.size()];
        int j = 0;
        for (int i : resSet) arr[j++] = i;
        return arr;
    }
}
```

# 58：小行星碰撞问题
## 题目：
给定一个整数数组 asteroids，表示在同一行的小行星。  
对于数组中的每一个元素，其绝对值表示小行星的大小，正负表示小行星的移动方向（正表示向右移动，负表示向左移动）。每一颗小行星以相同的速度移动。  
找出碰撞后剩下的所有小行星，结果保留原有顺序。  
碰撞规则：两个小行星相互碰撞，较小的小行星会爆炸。如果两颗小行星大小相同，则两颗小行星都会爆炸。两颗移动方向相同的小行星，永远不会发生碰撞。  

## 错误解答
我的第一次思路：从右向左检查是否会碰撞，然后去判断。
```java
import java.util.ArrayList;  
  
import static java.lang.Math.abs;  
  
public class Asteroid {  
    public int[] asteroidCollision(int[] asteroids) {  
        ArrayList<Integer> Asteroids = new ArrayList<>();  
        for (int i : asteroids) {  
            Asteroids.add(i);  
        }  
        //1.From last to first  
        int last = Asteroids.size() - 1;  
        int prev = Asteroids.size() - 2;  
        while (last >= 1 && prev >= 0) {  
            if (Asteroids.get(last) < 0 && Asteroids.get(prev) > 0) {  
                if (abs(Asteroids.get(last)) > abs(Asteroids.get(prev))) {  
                    Asteroids.remove(prev);  
                } else if (abs(Asteroids.get(last)) < abs(Asteroids.get(prev))) {  
                    Asteroids.remove(last);  
                } else {  
                    Asteroids.remove(last);  
                    Asteroids.remove(prev);  
                }  
            }  
            last--;  
            prev--;  
        }  
        int[] result = new int[Asteroids.size()];  
        for (int i = 0; i < Asteroids.size(); i++) {  
            result[i] = Asteroids.get(i);  
        }  
        return result;  
    }  
}
```

为什么错了呢？因为这样的话，可能出现碰完后继续碰撞的被忽略了。
考虑`[10,-5,-5]`，那么我的会输出的是`[10,-5]`
但这是不对的！
那么我们就要每次循环检查是否满足碰撞条件。于是可以进一步改进：
## 正确示范1
```java
import java.util.ArrayList;  
import static java.lang.Math.abs;  
  
public class Asteroid {  
    public int[] asteroidCollision(int[] asteroids) {  
        ArrayList<Integer> list = new ArrayList<>();  
        for (int i : asteroids) {  
            list.add(i);  
        }  
  
        boolean collisionOccurred;  
        do {  
            collisionOccurred = false;  
            // 每次从后往前扫描  
            int last = list.size() - 1;  
            int prev = list.size() - 2;  
  
            while (last >= 1 && prev >= 0) {  
                // 碰撞条件：左边向右(>0)，右边向左(<0)  
                if (list.get(prev) > 0 && list.get(last) < 0) {  
                    collisionOccurred = true;  
                    int leftVal = list.get(prev);  
                    int rightVal = list.get(last);  
  
                    if (abs(rightVal) > abs(leftVal)) {  
                        list.remove(prev); // 左边的碎了  
                    } else if (abs(rightVal) < abs(leftVal)) {  
                        list.remove(last); // 右边的碎了  
                    } else {  
                        // 都碎了：注意要先删下标大的(last)，再删小的(prev)  
                        list.remove(last);  
                        list.remove(prev);  
                    }  
                    // 一旦发生碰撞，当前的指针位置已经乱了，必须跳出内层循环重新扫描  
                    break;  
                }  
                last--;  
                prev--;  
            }  
        } while (collisionOccurred); // 如果这一轮有撞碎的，下一轮可能还有新的碰撞  
  
        // 转换回数组  
        int[] result = new int[list.size()];  
        for (int i = 0; i < list.size(); i++) {  
            result[i] = list.get(i);  
        }  
        return result;  
    }  
}
```

此方法时间复杂度是$O(n^2)$ ，非常之复杂。（与此同时，也过了）


## 正确示范2

### 1. 为什么我们需要“栈（Stack）”思想？

在之前的尝试中，我们发现“多次扫描”虽然直观，但效率较低（每次碰撞都要重头再来）。在 Java 开发中，当我们遇到“后进入的元素会与之前的元素发生交互”（如括号匹配、消除游戏、撤销操作）时，栈（Stack）是最佳选择。只要当前元素的操作取决于上一个元素的状态，且可能产生连锁反应，就请想到栈。
### 2. `ArrayList` 模拟栈的碰撞逻辑
我们将 `ArrayList` 看作一个只在末尾操作的容器。与其反复扫描整个列表，不如**只扫一遍数组**，在进入容器前就解决战斗。

### 3. 解答
```java
import java.util.ArrayList;

public class Asteroid {
    public int[] asteroidCollision(int[] asteroids) {
        // 使用 ArrayList 模拟栈的功能
        ArrayList<Integer> stack = new ArrayList<>();

        for (int ast : asteroids) {
            // 默认这颗行星是“活着”的
            boolean alive = true;

            // 发生碰撞的唯一条件：栈顶行星向右(>0)，当前行星向左(<0)
            while (alive && ast < 0 && !stack.isEmpty() && stack.get(stack.size() - 1) > 0) {
                int top = stack.get(stack.size() - 1);
                if (Math.abs(ast) > Math.abs(top)) {
                    // 1. 当前行星更强大：栈顶行星爆炸（移除），当前行星继续向左撞
                    stack.remove(stack.size() - 1);
                } else if (Math.abs(ast) == Math.abs(top)) {
                    // 2. 势均力敌：双双爆炸
                    stack.remove(stack.size() - 1);
                    alive = false; // 当前行星也碎了
                } else {
                    // 3. 栈顶更强大：当前行星爆炸
                    alive = false;
                }
            }
            // 如果历经碰撞后行星依然“活着”，或者根本没发生碰撞，则入栈
            if (alive) {
                stack.add(ast);
            }
        }

        // 将结果转换为 int[] 数组以符合测试要求
        int[] result = new int[stack.size()];
        for (int i = 0; i < stack.size(); i++) {
            result[i] = stack.get(i);
        }
        return result;
    }
}
```

---

### 3. 分析

|           | 反复扫描                | 栈                          |
| --------- | ------------------- | -------------------------- |
| **时间复杂度** | $O(n^2)$            | $O(n)$：                    |
| **空间稳定性** | 频繁 `remove` 导致数组位移。 | 仅在末尾操作，性能损耗极小。             |
| **代码逻辑**  | 需要多层循环和 flag 标记。    | 一个 `for` 加一个内部 `while` 搞定。 |

### 4. 总结
- **碰撞判断**：只有 `(栈顶 > 0 && 当前 < 0)` 这一种情况会相撞。
- **逻辑闭环**：使用 `boolean alive` 标记当前行星的状态，是处理“连锁碰撞”最简洁的方式。
- **集合转换**：`ArrayList` 转 `int[]` 目前需要手动遍历（或者使用 Java 8 的 `Stream` API，但初学者建议先手动遍历以加深对索引的理解）。