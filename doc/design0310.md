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



可能会碰到的事件

系统(nodejs)：
connection

online: studentId,dynamicPass
    1. 首次验证，这次需要数据库验证，取回privateKey，今后的每次验证只需在本地即可
    2. 告知关联用户（好友与所属群组成员），此用户在线了，触发system事件
    3. 修改用户表字段，标注用户上线状态。（这样后登陆用户将看见用户是否在线）
    4. 拉回因下线而未收到的群组消息与好友消息

say: messageDes(array),messageSource,imGroupFlag,imGroupId,messageContent,messageDate
    1. 遍历socketMap，为在线的用户触发 本地say，不在线的用户信息直接存进数据库。 触发本地say
    2. 转发的消息格式应该有所变化，messageDes应当不再是数组，而是单一的studentId。


offline:studentId
    1. 触发disconnect事件

disconnect:
    1. 设置一个timeout
    2. 再次获取用户关联用户，触发system事件，通知关联用户此用户下线,
    3. 修改用户表字段，标注用户下线状态

userflush(应该为本地事件，写在远程中，代表其纠结性...):
    现在有这么一个问题，userflush何时触发，理论上应当是用户被加进群组的那一刻触发，但是那一刻发生在java平台上，
    我可以这么做，把用户中userReady这个字段推迟到java异步方法调用完成再设置：
    1. 然后java去请求nodejs的某一个链接，传递希望触发的事件和用户Id，这个可以是userflush事件，并附带上所需的用户信息
    2. nodejs使用setInterval反复确认用户是否已经ready，并且加一个字段标记是否为新用户，如果二者均为true，触发本地的userflush事件

    userflush都做些什么: 前提是这样的，userflush只有群组需要，好友并不需要
    1. userflush应当包含新增用户所加入的全部群组ID，找出不重复的并在这些群组中的全部用户学号，然后抽取在线用户并将这些群组ID都发送给他们
    2. app将判断本地存储中是否有这些群组，如果有的话，更新这些群组的用户列表

本地(javascript):
system: type,data
    app本地的群组用户存储方法应当改变，专门有一个数组用来存储用户obj，多个群组只保留用户的studentId，这样可以保证数据不会被冗余存储多次，
    每次想查看好友列表或者某一个群组列表中的某个用户的详细信息时，只需向userList索取，额外的，如果非好友，应当暴露更少的隐私字段

    应该存在: userList(每个对象附加字段，isFriend)，memberList_GroupId, friendList

    1. type:online, data:{studentId:'1018110333'}
        应对这种事件，app应当遍历本地的userList，更新用户的在线状态
    2. type:offline, data:{studentId:'1018110323'}
        应对这种时间，app应当遍历本地的userList，更新用户的离线状态
    3. type:news, data:{新闻推送，留作后用}

say: messageDes,messageSource,imGroupFlag,imGroupId,messageContent,messageDate
    app本地收到此事件后，应该先检查消息是否来自群组，如果是，就找到群组，把消息render进群组中，
    如果否，就找到发送方，render到一对一聊天窗口中

userflush:为了更好的提升效率，什么时候才适合flush user，当用户进入一个群组时，群组的用户列表会在后台刷新，群组的用户刷新就会发生在这么一个时刻。
    当用户不处于群组聊天窗口时，对于收到的userflush事件，将会忽略。当用户处于好友聊天窗口时，对于收到的userflush事件，将会忽略。当用户处于群组
    聊天窗口时，收到userf事件，会判断群组id数组是否包含此群组，如果包含，将主动向java服务器请求群组列表，对本地的数据进行增量更新，而不是覆盖。

    groupIds(array)

    逻辑如同上述，不再重复。



