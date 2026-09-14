### 📦 核心架构总览：Java 集合界的“三足鼎立”

在非线性数据结构的荒野中，我们主要驾驭了三大流派。它们的本质区别在于**管理数据边界与秩序的方式**。

|**流派**|**核心接口**|**具体实现类**|**底层结构**|**核心特质 (MC 类比)**|**时间复杂度**|
|---|---|---|---|---|---|
|**散列派**|Map / Set|`HashMap`, `HashSet`|哈希表|瞬移与绝对唯一 (末影箱)|$O(1)$|
|**树形派**|Map / Set|`TreeMap`, `TreeSet`|红黑树|绝对排序与极值 (红石分拣机)|$O(\log n)$|
|**链表派**|Map|`LinkedHashMap`|哈希表 + 双向链表|历史记忆与时光机 (合成记录仪)|$O(1)$|

---

### 🟢 第一篇章：哈希流派 (Hash Family) —— 极致的速度与唯一

这是 90% 业务场景的基石。哈希表不讲究先来后到，只在乎“你是谁”和“你在哪”。

#### 1. HashMap：万物皆可映射

**核心逻辑**：键值对映射，键（Key）绝对唯一，值（Value）可以重复。新键覆盖旧键。
```java
import java.util.HashMap;
import java.util.Map;

public class HashReview {
    public static void main(String[] args) {
        Map<String, Integer> inventory = new HashMap<>();
        
        // 1. 基础插入与覆盖
        inventory.put("Iron", 10);
        inventory.put("Iron", 64); // 覆盖旧值，Iron 变成 64

        // 2. 经典计次逻辑 (非常重要：getOrDefault 的妙用)
        String dropItem = "Gold";
        // 拆解：如果 Gold 存在，取原值加1；如果不存在，取 0 加 1
        inventory.put(dropItem, inventory.getOrDefault(dropItem, 0) + 1);

        // 3. 高效遍历 (拒绝 keySet() + get() 的两次查找)
        for (Map.Entry<String, Integer> entry : inventory.entrySet()) {
            System.out.println("物资: " + entry.getKey() + " 数量: " + entry.getValue());
        }

        // 4. 纯值提取 (当你只关心经济总量，不关心具体物品时)
        int totalItems = 0;
        for (int count : inventory.values()) {
            totalItems += count;
        }
    }
}
```

#### 2. HashSet：绝对的领域

**核心逻辑**：基于 HashMap 实现（所有的元素作为 Key 存入，Value 塞入一个虚拟对象）。它只关心“存在与否”。
```java
import java.util.HashSet;
import java.util.Arrays;
import java.util.Set;

public class SetReview {
    public static void main(String[] args) {
        Set<String> steveLoot = new HashSet<>(Arrays.asList("Diamond", "Iron", "Gold"));
        Set<String> alexLoot = new HashSet<>(Arrays.asList("Iron", "Coal", "Gold"));

        // 1. 求交集 (两人都有的) - 注意：必须操作副本以保护原数据！
        Set<String> intersection = new HashSet<>(steveLoot);
        intersection.retainAll(alexLoot); // 结果: [Iron, Gold]

        // 2. 求并集 (所有的种类)
        Set<String> union = new HashSet<>(steveLoot);
        union.addAll(alexLoot); // 结果: [Diamond, Iron, Gold, Coal]
    }
}
```

#### ⚠️ 致命陷阱： equals 与 hashCode 的契约

**原理拆解**：

- 当你使用自定义对象（如 `Player`, `Position`, `LSymbol`）作为 HashMap 的 Key 或塞入 HashSet 时，**必须同时重写 `equals` 和 `hashCode`**。
    
- `hashCode` 是寻找存放抽屉的“指南针”。
    
- `equals` 是在抽屉里确认身份的“显微镜”。
    
- **契约**：如果两个对象 `equals` 为 true，它们的 `hashCode` 必须相等。
    

---

### 🔵 第二篇章：树形流派 (Tree Family) —— 强迫症的福音

当你需要排行榜、需要极值、需要按字典序排列时，抛弃 Hash，拥抱 Tree。

#### 1. TreeMap / TreeSet：自动排序的魔法

**核心逻辑**：底层基于自平衡的红黑树。每插入一个元素，它都会自动与现有元素比对大小并调整位置。
```java
import java.util.TreeMap;
import java.util.TreeSet;

public class TreeReview {
    public static void main(String[] args) {
        // --- TreeMap 极值与排序 ---
        TreeMap<String, Integer> leaderboard = new TreeMap<>();
        leaderboard.put("Steve", 50);
        leaderboard.put("Alex", 120);
        leaderboard.put("Bob", 80);

        // 输出一定按 A-Z 排列：Alex, Bob, Steve
        System.out.println("首字母玩家: " + leaderboard.firstKey()); // Alex
        System.out.println("末字母玩家: " + leaderboard.lastKey());  // Steve

        // --- TreeSet 极值 ---
        TreeSet<Integer> scores = new TreeSet<>();
        scores.add(50);
        scores.add(120);
        scores.add(80);

        // 直接锁定极值
        System.out.println("最高分: " + scores.last());  // 120
        System.out.println("最低分: " + scores.first()); // 50
    }
}
```

---

### 🟣 第三篇章：链表流派 (Linked Family) —— 时空的刻痕

当你既需要 HashMap 的 $O(1)$ 查找速度，又需要记录“谁先谁后”时。

#### LinkedHashMap：带时间戳的储物柜

**核心逻辑**：在 HashMap 的桶之外，穿插了一根双向链表。
```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LinkedReview {
    public static void main(String[] args) {
        // 比如用于记录玩家最后合成的 3 件物品
        Map<String, Integer> craftHistory = new LinkedHashMap<>();
        craftHistory.put("木棍", 4);
        craftHistory.put("木镐", 1);
        craftHistory.put("火把", 4);

        // 遍历顺序严格按照插入顺序：木棍 -> 木镐 -> 火把
        for (String item : craftHistory.keySet()) {
            System.out.println("合成历史: " + item);
        }
    }
}
```

---

### 🏆 终极心法：工程化组合与数据驱动

在高级开发中，数据结构往往是组合使用的。比如：你需要统计每个玩家拥有的每种方块的数量。

**方案**：`Map<String, Map<String, Integer>> playerInventory;` (外层 Key 是玩家名，内层是物品与数量)。

我们在最后练习的流式编程（Stream API），就是将数据的流转高度抽象化：

`数组 -> flatMap(展平) -> collect(聚合) -> TreeMap(排序)`。