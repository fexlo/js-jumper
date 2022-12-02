# js-jumper README

Solve the problem that "go definition" does not work when using import syntax to import files such as .vue in js files

解决在js文件中，当使用`import`语法导入.vue等文件时，"go definition"导航到定义不工作的问题

## If a path alias is used, alias identification is supported
## 如使用了路径别名，支持别名识别
```json
// preset
// 预置
{
  "@": "src"
}
```


## Support configuration to find files with specified extensions when navigating to definitions
## 支持配置导航到定义时查找指定扩展名文件
```json
// preset .vue file extension name
// 预置 .vue扩展
["vue"]
```



## Support for omitting extensions
## 支持省略扩展名
```js
// Assuming the file exists @/src/common/component/search.vue
// 假设存在文件@/src/common/component/search.vue
import Search from '@/src/common/component/search'
```


## Support import path to omit index.vue
## 支持导入路径省略index.vue
```js
// Assuming the file exists @/src/common/component/search/index.vue
// 假设存在文件@/src/common/component/search/index.vue
import Search from '@/src/common/component/search'
```