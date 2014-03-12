##The Design of LifeDjtu_IM

群组聊天

多个群组

SameCourse_12321321
SameClass_12321321
SameGrade_12321321

SameCourse_321421
SameClass_321421
SameGrade_321421

...
...
...


改变数据库结构，添加群组表，为用户建立预先关联。
这种预先关联应该在用户添加课程时进行，今后，用户在添加课程，同样应该对群组表进行更新，如果群组事先不存在，就新创立一个。

每种课程的群组应该有两个：

sameClass(courseInstanceId)
sameCourse(courseId)

取群组用户时，可以直接使用courseInstanceId(remoteId)查找到唯一的同课同班群组，可以直接使用courseId(courseAlias)查找到唯一的同课群组。

一种Course只有一个唯一群组，一个CourseInstance只有一个唯一群组。

group表存储群组记录
groupUser表存储用户与群组关联性

InstantMessage表存储用户没有接收到的即时信息，其中字段值得说明

to 应该接受该信息的用户
from 发送该信息的用户

groupFlag 信息是否来自于群组
groupId 群组Id

date信息发送日期

read用户是否已经抓取到（信息如果已经由用户抓取走，此标记标记为1，默认为0）

每晚清理线程会清楚一天的冗余缓存信息（即已经被离线用户读取过的信息）

user表也应当增加字段，标记是否在线（是否可能接收到消息）

增加表friend，表记录单向朋友关系，即一个人加另一个好友，另一个人可以同意但是不必添加对方为好友