`Kadane` 算法（Kadane's Algorithm）是解决 **“最大子数组和” (Maximum Subarray Sum)** 问题最经典、最高效的方法。

它的核心目标是在一个给定的整数数组中，找到一个具有最大和的**连续**子数组，并返回其和。
## 1. 核心思想：动态规划

Kadane 算法的本质是**动态规划**。对于数组中的每一个元素，我们只需要考虑一个问题：

> 是把当前元素**加入**之前的累加序列，还是**从当前元素开始**一个新的序列？

### 状态转移方程

假设 `current_sum` 是以当前位置结尾的最大子数组和，`max_so_far` 是全局寻找过的最大和。

对于索引为 $i$ 的元素 $A[i]$：

1. **`current_sum = max(A[i], current_sum + A[i])`**
    
    - 如果 `current_sum + A[i]` 比 `A[i]` 还小，说明前面的累加贡献是负的，不如直接从 $A[i]$ 重新开始。
2. **`max_so_far = max(max_so_far, current_sum)`**
    - 更新目前为止发现的最大和。
## 2. 算法步骤示例

假设数组为：`[-2, 1, -3, 4, -1, 2, 1, -5, 4]`

|**步骤**|**元素**|**当前子数组计算方式**|**current_sum**|**max_so_far**|
|---|---|---|---|---|
|1|-2|开始|-2|-2|
|2|1|max(1, -2+1)|1|1|
|3|-3|max(-3, 1-3)|-2|1|
|4|4|max(4, -2+4)|**4**|**4**|
|5|-1|max(-1, 4-1)|3|4|
|6|2|max(2, 3+2)|5|5|
|7|1|max(1, 5+1)|**6**|**6** (最大值)|
|8|-5|max(-5, 6-5)|1|6|

---

## 3. 代码实现
```c
#include <stdio.h>

int max_subarray_sum(int nums[], int size) {
    int max_so_far = nums[0];
    int current_sum = nums[0];

    for (int i = 1; i < size; i++) {
        // current_sum = max(nums[i], current_sum + nums[i])
        current_sum = (nums[i] > current_sum + nums[i]) ? nums[i] : (current_sum + nums[i]);
        
        // max_so_far = max(max_so_far, current_sum)
        if (current_sum > max_so_far) {
            max_so_far = current_sum;
        }
    }
    return max_so_far;
}

int main() {
    int arr[] = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    int result = max_subarray_sum(arr, n);
    printf("最大子数组和是: %d\n", result);
    
    return 0;
}
```

## 4. 复杂度分析

- 时间复杂度：$O(n)$
只需要遍历一次数组，效率极高。
- 空间复杂度：$O(1)$
只需要两个变量来存储当前和及最大和。
## 5. 常见变体
1. **全负数情况：** 传统的 Kadane 算法可以处理全负数（返回其中最大的那个负数）。
2. **记录位置：** 如果需要返回具体是**哪一段**子数组，可以增加 `start` 和 `end` 变量，在更新 `max_so_far` 时同步更新索引。
3. **环形数组最大和：** 可以通过“总和减去最小子数组和”的思路，结合 Kadane 算法来解决。