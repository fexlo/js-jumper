/*
 * @Author: hoyche
 * @Date: 2022-11-26
 */
import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');
type ProvideDefinitionArgs = { document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken };
type AliasConfigs = { [key: string]: string };
export default class JSJumper implements vscode.DefinitionProvider {
  // 别名配置
  aliasConfigs: AliasConfigs;
  // 扩展激活回调对象集合
  instance: ProvideDefinitionArgs;
  // 当前点击的导入路径
  improtPath: string;
  // 当前点击的导入文件的扩展名
  fileNameExt: string;
  // 当前点击的导入文件名
  fileName: string;
  // 当前点击的导入补全后的集合
  improtPaths: string[];
  // 捕获到了别名
  matchedAlias: boolean;
  // 捕获到了扩展名
  matchedExt: boolean;
  // 需查找的文件扩展名
  exts: string[];
  constructor() {
    const configParams = vscode.workspace.getConfiguration('js-jumper');
    this.instance = null as unknown as ProvideDefinitionArgs;
    this.improtPath = '';
    this.improtPaths = [];
    this.matchedAlias = false;
    this.fileName = '';
    this.fileNameExt = '';
    this.matchedExt = false;
    this.exts = configParams.get('fileTypes') as Array<string>;
    const aliasConfigs = {...configParams.get('aliasConfigs')} as AliasConfigs;
    for (const key in aliasConfigs) {
      // 统一转换成反斜杠
      const val = aliasConfigs[key].replace(/\\/g,'/');
      // ./替换成/
      if (/^\.\//.test(val)) {
        aliasConfigs[key] = val.replace(/^\./,'');
      } else if (!/^\//.test(val)) {
        // 不是以根目录开始 追加上根目录
        aliasConfigs[key] = '/' + val;
      }
    }
    this.aliasConfigs = aliasConfigs as AliasConfigs;
  }
  getImportPath() {
    const { document, position } = this.instance;
    const currentClickLineText = document.lineAt(position.line).text;
    const reg = /import\s+([^;\n]+)/g;
    // 收集所有import语句片段
    const importParts = [];
    let match;
    while ((match = reg.exec(currentClickLineText)) !== null) {
      importParts.push({
        match: match[0],
        index: match.index
      });
    }
    const cursor = position.character;
    // 过滤出当前点击的import语句
    this.improtPath = importParts.filter(item => {
      return item.index <= cursor && item.match.length >= cursor;
    })[0]?.match?.match(/['"]([^'"]+)['"]/)?.[1] ?? '';
  }
  getImprotPaths() {
    const { aliasConfigs, improtPath, matchedExt, fileName, exts } = this;
    const impMatchs: string[] = [];
    for (const key in aliasConfigs) {
      // 如果命中别名
      if (improtPath.search(key) === 0) {
        // 将别名替换成配置的路径
        let alias = aliasConfigs[key];
        _polyImportPaths(improtPath.replace(key, alias), impMatchs);
      }
    }
    if (impMatchs.length) {
      // 别名补全路径
      this.improtPaths = impMatchs;
      this.matchedAlias = true;
    } else {
      // 非别名补全路径
      this.improtPaths = _polyImportPaths(improtPath, []);
      this.matchedAlias = false;
    }

    function _polyImportPaths(uri: string, colls: string[]): string[] {
      // 没有扩展名
      if (!matchedExt) {
        exts.forEach(ext => {
          // 直接加上扩展名
          colls.push(`${uri}.${ext}`);

          // 不是index文件 将它看作目录 额外追加一个index.扩展名文件路径
          if (fileName.search(/^index\.?/) === -1) {
            colls.push(`${uri}/index.${ext}`);
          }
        });
      } else {
        colls.push(uri);
      }
      return colls;
    }
  }
  getFileNameAndExt() {
    this.fileName = (this.improtPath.match(/([^/]+)$/)?.[0] ?? '');
    const split = this.fileName.split('.');
    if (split.length > 1) {
      this.matchedExt = true;
      this.fileNameExt = split[1];
    } else {
      this.matchedExt = false;
      this.fileNameExt = '';
    }
  }
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<null | vscode.Location[]> {
    this.instance = { document, position, token };
    return new Promise(async (resolve) => {

      // 获取当前点击import表达式的路径
      this.getImportPath();

      // 获取导入语句的文件和扩展名
      this.getFileNameAndExt();

      // 获取全部补全路径
      // 1. 使用了别名，vscode仅别名js文件， 别名路径如果引用的是非js文件不支持跳转
      // 2. 不带文件名后缀
      // 3. 省略了index文件名，导入仅写到目录
      this.getImprotPaths();

      // 当前文件路径
      const currFileDir = document.fileName.match(/.+\\+/)?.[0] ?? '';
      // console.log('improtPaths', this.improtPaths);
      const res:vscode.Location[] = [];

      // 找出当前工作区文件夹目录
      const currentWorkSpaceDir = vscode.workspace.workspaceFolders?.filter(item => item.name === vscode.workspace.name)[0].uri.fsPath;
      this.improtPaths.forEach(uri => {
        let batUri: string;
        if (/^(\.\/)|^[^\.\/]/.test(uri)) {
          // 相对路径
          batUri = path.resolve(currFileDir, uri);
        } else {
          // 绝对路径

          // 将打头的/去除
          batUri = path.resolve(currentWorkSpaceDir, uri.replace(/^\//,''));
        }
        if (fs.existsSync(batUri)) {
          console.log('batUri :>> ', batUri);
          res.push(new vscode.Location(vscode.Uri.file(batUri), new vscode.Position(0, 1)));
        }
      });
      if (res.length) {
        resolve(res);
      } else {
        resolve(null);
      }
    });
  }
}
