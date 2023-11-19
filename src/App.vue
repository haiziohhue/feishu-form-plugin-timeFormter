<script setup>
import {ref, onMounted} from 'vue'
import {bitable, FieldType} from '@lark-base-open/js-sdk';
import dayjs from "dayjs";
import moment from "moment";

const Time = ref()
const input = ref('')
const Formats = ref([
  'YYYY-MM-DD',
  'YYYY-MM-DD,HH:mm',
  'YY年-MM月-DD日'
])
const Handing = ref(false)
const statusText = ref("等待中")
const addFormats = ref({
  value: '',
  show: false,
  confirm: function () {
	if (Handing.value === true) {
	  console.log("正在执行中")
	  return
	}
	Formats.value.push(this.value)
	this.value = ''
  },
  cannnel: function () {
	this.value = ''
	this.show = false
  }
})
const TextToNum = async (val) => {
  let timestamp = null
  for (let format of Formats.value) {
	const parseDate = moment(val, format, true)
	if (parseDate.isValid()) {
	  timestamp = parseDate.valueOf()
	  break
	}
  }
  return timestamp
}
const NumToText = async (val) => {
  let Val = val
  if (val.toString().length > 10) {
	Val = Val / 1000
  }
  const time = await dayjs.unix(Val)
  if (input.value === '') {
	return time.format('YYYY-MM-DD HH:mm:ss')
  }
  return time.format(input.value)
}
const Review = () => {
  const time = new Date()
  console.log(time.valueOf())
  const timeUnix = dayjs.unix(time.valueOf() / 1000)
  if (input.value) {
	return timeUnix.format(input.value)
  } else {
	return `默认样式:${timeUnix.format('YYYY-MM-DD HH:mm:ss')}`
  }

}
const textChange = async (mode) => {
  console.groupEnd()
  if (Handing.value === true) {
	console.log("正在执行中")
	return
  }
  statusText.value = "转换中，请勿进行其他操作"
  Handing.value = true
  if (mode !== "T_ToN" && mode !== "N_ToT") {
	console.log("出错，mode不对")
	Handing.value = false
	return
  }
  console.log("开始获取列表")
  const {tableId, fieldId} = await bitable.base.getSelection();
  if (fieldId === null) {
	statusText.value = "请选择一个列"
	Handing.value = false

  }
  const table = await bitable.base.getTable(tableId)
  const recordIds = await table.getRecordIdList()
  let FailCount = 0
  const numberField = await table.getField(fieldId);
  console.log({tableId, fieldId, table, recordIds, numberField})
  console.log("开始循环")
  console.group("循环操作表")
  if (mode === "N_ToT") {
	const arr = []
	for (let record of recordIds) {
	  const cellValue = await table.getCellValue(fieldId, record);
	  let newVal
	  if (typeof cellValue !== "number") {
		console.log("非数字")
		arr.push(cellValue[0].text)
		continue
	  } else {
		newVal = await NumToText(cellValue)
	  }
	  if (newVal === null) {
		console.log({record, msg: "替换失败"})
		arr.push(cellValue)
		FailCount++
		continue
	  }
	  arr.push(newVal)
	  console.log({record, newVal})
	}
	await table.setField(fieldId, {
	  type: FieldType.Text
	})
	let index = 0
	for (let record of recordIds) {
	  await numberField.setValue(record, arr[index])
	  index++
	}
  } else if (mode === "T_ToN") {
	const arr = []
	for (let record of recordIds) {
	  const cellValue = await table.getCellValue(fieldId, record);
	  if (typeof cellValue === "number") {
		arr.push(cellValue)
	  } else if (cellValue[0].type !== "text") {
		arr.push(cellValue[0].value)
		FailCount++
	  } else {
		const newVal = await TextToNum(cellValue[0].text)
		if (newVal === null) {
		  arr.push(cellValue[0].text)
		} else {
		  arr.push(newVal)
		}
	  }
	}
	await table.setField(fieldId, {
	  type: FieldType.DateTime
	})
	let index = 0
	console.log(arr)
	for (let record of recordIds) {
	  await table.setCellValue(fieldId,record, arr[index])
	  console.log(arr[index])
	  index++
	}
  }
  console.groupEnd()
  if (FailCount === 0) {
	statusText.value = "替换完成！全部替换成功"
  } else {
	statusText.value = `替换完毕，有${FailCount}处替换失败`
  }
  Handing.value = false
}

const deleteFormats = (index) => {
  if (Handing.value === true) {
	console.log("正在执行中")
	return
  }
  Formats.value.splice(index, 1)
}
const test = async ()=>{
  const {tableId, fieldId} = await bitable.base.getSelection();
  const Select =  await bitable.base.getSelection()
  const table = await bitable.base.getTable(tableId)
  const recordIds = await table.getRecordIdList()
  const numberField = await table.getField(fieldId);
  const fieldMeta = await table.getFieldMetaById(fieldId);
  console.log({tableId, fieldId, table, recordIds, numberField,Select,fieldMeta})
}
onMounted(async () => {
  Time.value = await new Date()
})
</script>

<template>
	<button @click="test"></button>
  <div class="status">
	使用指导：{{ statusText }}
  </div>
  <div class="blockquote">
	使用方法：
	<p>仅支持文本、日期、数字之间相互转换，请尽可能保证值有效</p>
	<p>1.选中表格中的一列</p>
	<p>2.然后进行操作</p>
	<p>日期格式使用指南</p>
	<p>以2023年1月2日3时4分5秒为例</p>
	<p>YYYY:2023，YY:23</p>
	<p>M:1，MM:01,MMM:Jan</p>
	<p>D:2，DD:02</p>
	<p>H:3，HH:03</p>
	<p>m:4，mm:04</p>
	<p>s:5，ss:05</p>
  </div>
  <div class="box">
	<div class="title">将当前日期转化为自定义文本</div>
	<div class="content">
	  <p>
		请在以下输入框中输入想要转化的文本样式，
	  </p>
	  <p>
		然后点击转换即可将数字样式转换为相应文本样式
	  </p>
	  <p>
		预览效果：
	  </p>
	  <p>
		{{ Review() }}
	  </p>
	</div>
	<div class="NtoTRules"><input v-model="input" placeholder="YY/MM/DD HH:mm:ss"/></div>
	<div>
	  <button class="table" @click="textChange('N_ToT')">开始转换表格</button>
	</div>
  </div>
  <div class="box">
	<div class="title">将当前列自定义文本转化为日期</div>
	<div class="content">
	  <p>
		当前转化规则列表
	  </p>
	  <p>
		可以自行增加转换格式
	  </p>
	</div>
	<div class="table">
	  <div v-for="(item,index) in Formats" class="list">
		<div class="listItem">{{ item }}</div>
		<div class="listDelete">
		  <button @click="deleteFormats(index)">删除</button>
		</div>
	  </div>
	  <div v-if="addFormats.show">
		<div style="margin: 4px 0">
		  <input v-model="addFormats.value"/>
		</div>
		<div>
		  <button class="addFrom addFromConfirm" @click="addFormats.confirm()">确认</button>
		  <button class="addFrom addFromCancel" @click="addFormats.cannnel()">取消</button>
		</div>
	  </div>
	  <button v-else class="table" @click="addFormats.show=true">添加样式</button>

	</div>
	<div style="margin: 16px 0">
	  <button class="table" @click="textChange('T_ToN')">开始转换表格</button>
	</div>
  </div>

</template>

<style scoped>
* {
  font-family: "微软雅黑";
}

main {
  padding: 1rem;
}

h4 {
  font-size: calc(1.275rem + 0.3vw);
  margin-bottom: 1rem;
}

.status {
  background-color: #d1edc4;
  height: 40px;
  width: 100vh;
  text-indent: 2em;

  line-height: 40px;
}

code {
  font-size: 0.875em;
  color: #d63384;
  word-wrap: break-word;
}

.box {
  margin: 12px;
  border-radius: 8px;
  padding: 16px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: large;
  font-weight: 600;
  margin-bottom: 16px;
}

.blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  margin: 16px;
  color: #6a737d;
}

.blockquote p {
  margin: 12px 0
}

.table {
  display: table;
  width: 100%;
  border-collapse: collapse;
}

.list {
  font-size: small;
  margin: 4px;
  padding: 8px;
  border-bottom: 1px solid #cccccc;
  display: flex;
  justify-content: space-evenly;
}

.content p {
  margin: 4px;
  font-size: small;
}

.listItem {
  flex: 3;
}

.listDelete {
  flex: 1 0 40px;
}

.listDelete button {
  padding: 0 16px;
}

.listDelete button:hover {
  background-color: #F56C6C;
  color: #ffffff;
}

button {
  background-color: #ffffff;
  color: #333333;
  border: none;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border-radius: 16px;
}

.addFrom {
  border-radius: 4px;
  margin: 0 8px;
}

.addFromCancel {
  background-color: #fcd3d3
}

.addFromConfirm {
  background-color: #d1edc4
}

.addFromCancel:hover {
  background-color: #F56C6C;
  color: #ffffff;
}

.addFromConfirm:hover {
  background-color: #67C23A;
  color: #ffffff;
}

button:hover {
  color: #ffffff;
  background-color: #409EFF;
}

.NtoTRules {
  margin: 12px 0;
}

input {
  border: 1px solid #cccccc;
  padding: 8px;
  font-size: 14px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
