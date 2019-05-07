## 属性

- `ZERO` [static] `0ms` 仅用于调试或者特殊情况
- `SHORTEST_INVALIDATE` [static] 最短失效时间 15分钟的毫秒数，以下时间的计算基础值
- `SHORTER_INVALIDATE`  [static] 较短失效时间 30分钟
- `SHORT_INVALIDATE`  [static] 短失效时间 1个小时
- `LONG_INVALIDATE`  [static] 长失效时间 3个小时
- `LONGER_INVALIDATE`  [static] 较长的失效时间 6个小时
- `LONGEST_INVALIDATE`  [static] 很长的失效时间 1天
- `TOO_LONG_INVALIDATE`  [static] 非常长的失效时间 2天
- `FOREVER` [static] 持续有效，直至换设备或者应用被删除
- `TEST_INVALIDATE` [static] 10秒失效时间，仅用于调试或者测试
- `debug` 开启或关闭debug模式，开启debug模式可以输出模块运行过程中的警告，错误和输出。

## 方法

#### `setup`

begonia规定的增强模块的启动方法。

在此方法中，`StorageManager`会调用检测一次小程序的缓存使用情况，确定是否还有存储空间。

#### `destroy`

begonia规定的增强模块的销毁方法。

运行方法之后，模块不可再用，只能被回收。

>注意：运行`destroy()`方法并不会导致所有的缓存被清空，下次启动时如果还需要使用模块，缓存仍然保存完好。

#### `createStorage`

创建一个专属缓存对象

- `masterKey` 存储的主键名
- `invalidateTime` 缓存失效时间，默认为`0ms`
- `isSync` 是否使用同步方式存取，默认`false`，使用异步方式存取

返回
- StorageInfo实例 专属缓存对象，可复用，用来多次进行存取数据。


#### `checkInvalidate`

检查并删除所有过期数据。过期的数据将会被删除，存储空间会被释放。

此方法主要用在需要清理缓存或者定期清理的场合。


#### `deleteDataByMasterKey`

删除某一个masterKey下的所有缓存数据，不论是否过期

#### `clearAll`

删除所有缓存

#### `quickSave`

便捷存储方式。每次都需要完整的输入信息。

内部直接使用了同步的存储方式，格式仍然是按照约定设置。

>适用于少量，频繁使用的数据。对于大量数据，即使是频繁更新的，如果使用也会带来负担。

- `masterKey` 主键名
- `invalidateTime` 存储数据的持续时间段
- `params` 参数集合
- `data` 存储的值 
- `cb` 回调函数，`function(error,result){}`

#### `quickRead`

便捷读取方式。每次都需要完整的输入信息。

内部直接使用了同步的存储方式，格式仍然是按照约定设置。

>适用于少量，频繁使用的数据。

- `masterKey` 主键名
- `params` 参数集合
- `cb` 回调函数，`function(error,result){}`