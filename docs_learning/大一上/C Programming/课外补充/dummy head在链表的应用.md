# 介绍
在C语言的链表操作中，**Dummy Head（假头节点）** 是一个非常有用的技巧。它是一个**不存储有效数据**（或者其数据域不被使用）的节点，始终位于链表的真正首节点之前。

使用 Dummy Head 的核心目的在于：**消除对“头节点”的特殊处理，使所有节点的插入和删除逻辑保持一致。**
### 1. 为什么需要 Dummy Head？
在不使用 Dummy Head 的情况下，修改链表头部的操作（如：在头部插入节点、删除头节点）需要单独编写逻辑，因为你必须修改指向链表起始位置的那个指针（通常是 `head` 指针）。
**没有 Dummy Head 的代码片段：**
```c
// 删除值为 val 的节点
if (head != NULL && head->val == val) {
    struct Node* temp = head;
    head = head->next; // 必须特殊处理 head
    free(temp);
}
```
有了 Dummy Head：
无论删除哪个节点，该节点前面一定有一个节点。可以统一使用 `prev->next = prev->next->next` 来处理。
### 2. 典型应用场景
#### A. 简化节点插入（如：合并两个有序链表）
当你需要从零开始构建一个新链表时，Dummy Head 可以避免判断“这是第一个节点吗？”的逻辑。
```c
struct ListNode* mergeTwoLists(struct ListNode* l1, struct ListNode* l2) {
    struct ListNode dummy; // 在栈上创建，无需手动释放
    struct ListNode* tail = &dummy;
    dummy.next = NULL;

    while (l1 && l2) {
        if (l1->val < l2->val) {
            tail->next = l1;
            l1 = l1->next;
        } else {
            tail->next = l2;
            l2 = l2->next;
        }
        tail = tail->next;
    }
    tail->next = l1 ? l1 : l2;
    return dummy.next; // 返回真正的头节点
}
```
#### B. 删除指定值的节点
如果目标节点恰好是头节点，Dummy Head 让你能像删除中间节点一样处理它。
#### C. 链表分区 (Partition List)
将链表按某个值分为两部分（例如小于 x 的在前，大于等于 x 的在后）。你可以准备两个 Dummy Head，分别代表两个子链表的起点，最后再把它们连接起来。
### 3. Dummy Head 的优势总结

|**优势**|**说明**|
|---|---|
|**逻辑统一**|插入和删除操作不需要判断 `if (prev == NULL)` 或 `if (current == head)`。|
|**代码简洁**|减少了条件分支，降低了出错（如空指针解引用）的概率。|
|**易于维护**|算法核心逻辑更清晰，不需要处理复杂的边界情况。|

### 4. 使用建议
- **栈 vs 堆：** 在 C 语言中，你可以像 `struct ListNode dummy;` 这样在栈上声明它，这样就不需要 `malloc` 和 `free`。
- **返回结果：** 函数结束时，通常返回 `dummy.next`，这才是用户真正需要的链表头。
- **内存管理：** 如果你是通过 `malloc` 创建的 Dummy Head，记得在函数结束前释放它，或者确保调用者知道它的存在。
# 初始化
在 C 语言中，Dummy Head（哑头节点）和 Dummy Tail（哑尾节点）的初始化方式取决于你希望将它们分配在 **栈（Stack）** 上还是 **堆（Heap）** 上。
通常情况下，单向链表多使用 **Dummy Head**；而双向链表为了操作方便，往往会同时使用 **Dummy Head** 和 **Dummy Tail**。
### 1. 局部变量初始化（栈分配）
这是在算法题目（如 LeetCode）中最常用的方式。它不需要手动 `free`，效率极高。
```c
struct ListNode {
    int val;
    struct ListNode *next;
};

void dynamicListExample() {
    // 1. 初始化 Dummy Head
    struct ListNode dummy; 
    dummy.val = 0;      // 习惯上赋 0，但其实值不重要
    dummy.next = NULL;  // 关键：初始指向 NULL

    struct ListNode *cur = &dummy; // 使用指针操作

    // ... 进行链表拼接操作 (cur->next = newNode; cur = cur->next; ...)

    // 2. 返回结果
    // return dummy.next; 
}
```

---
### 2. 动态内存初始化（堆分配）

如果你正在构建一个持久化的数据结构（如一个自定义的 Queue 或 List 库），则需要使用 `malloc`。
```c
typedef struct Node {
    int data;
    struct Node *prev;
    struct Node *next;
} Node;

// 初始化一个带头尾哨兵的双向链表
Node* initList() {
    Node *head = (Node*)malloc(sizeof(Node));
    Node *tail = (Node*)malloc(sizeof(Node));

    if (!head || !tail) return NULL;

    head->prev = NULL;
    head->next = tail; // 头指向尾

    tail->prev = head; // 尾指向头
    tail->next = NULL;

    return head;
}
```

---

### 3. 初始化时的关键点

#### **A. 哑节点的值 (Value)**

- **无意义原则**：通常给 `val` 赋 `0` 或 `-1`。在逻辑实现中，应**永远不要**读取哑节点的数据域。
    
- **哨兵原则**：有时为了简化搜索，可以将待查的目标值放入哑节点（即“哨兵搜索”），但这超出了普通的 Dummy Head 用法。
    

#### **B. 指针的指向**

- **单链表**：`dummy->next` 必须初始化为 `NULL` 或真实的第一个节点。
    
- **双链表**：初始化时必须让 `head->next = tail` 且 `tail->prev = head`。这样可以保证即使链表为空（没有任何数据节点），`head->next` 和 `tail->prev` 也不为空指针，从而避免复杂的判空逻辑。
    

---

### 4. 初始化对比表

|**特性**|**栈初始化 (struct Node dummy)**|**堆初始化 (malloc)**|
|---|---|---|
|**内存释放**|自动释放，无需 `free`|必须手动 `free`，否则内存泄漏|
|**作用域**|仅限当前函数内部|全局或随结构体生命周期|
|**性能**|极快（仅移动栈指针）|较慢（涉及系统调用）|
|**适用场景**|临时算法逻辑、合并链表|长期维护的数据结构、类库开发|

---

### 5. 易错提醒

在 C 语言中，如果你在函数里写了 `struct ListNode dummy;`，**绝对不要**返回 `&dummy`。因为函数结束时栈帧销毁，该地址将失效。你应该始终返回 `dummy.next`（它指向的是堆上的节点或传入的节点）。