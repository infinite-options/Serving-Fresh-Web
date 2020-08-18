let base_api = 'https://phaqvwjbw6.execute-api.us-west-1.amazonaws.com/dev/api/v1'
// let base_api = 'http://localhost:5000/api/v1'
let savedGroups = []
let savedMessages = []
let colDefs = [
  {field: '', headerCheckboxSelection: true, checkboxSelection: true,
   headerCheckboxSelectionFilteredOnly: true, width: 50},
  {headerName: 'Name', field: 'name'},
  {headerName: 'Email', field: 'email'},
  {headerName: 'Phone', field: 'phone'},
  {headerName: 'Address', field: 'address'},
  {headerName: 'City', field: 'city'},
  {headerName: 'Zip Code', field: 'zipCode'},
  {headerName: 'Kitchen', field: 'kitchen'},
  {headerName: '# Orders', field: 'n_orders'},
  {headerName: 'Created', field: 'first_order'},
  {headerName: 'Last Order', field: 'last_order'},
  {headerName: 'App Version', field: 'appVersion'}
]
colDefs.forEach(colDef => {
  if (colDef.field) colDef.sortable = true
  colDef.suppressMovable = true
  colDef.filterParams = {
    buttons: ['apply', 'reset']
  }
  switch (colDef.field) {
    case '':
      break
    case 'n_orders':
      colDef.filter = 'agNumberColumnFilter'
      break
    case 'first_order':
    case 'last_order':
      colDef.filter = 'agDateColumnFilter'
      colDef.filterParams.comparator = function(filterDate, cellValue) {
        var dateParts = cellValue.split('-')
        var day = parseInt(dateParts[2])
        var month = parseInt(dateParts[1]) - 1
        var year = parseInt(dateParts[0])
        var cellDate = new Date(year, month, day)
        return (cellDate > filterDate ? 1 : cellDate < filterDate ? -1 : 0)
      }
      break
    default:
      colDef.filter = true
  }
})
let grid

function resize() {
  document.querySelector(type === 'notifications' ? '#notificationGrid' : '#smsGrid').style =
   `height: ${window.innerWidth > 991 ? window.innerHeight-86 : 480}px`
  document.querySelector('#myTextBox').style = `height: ${window.innerWidth > 991 ? window.innerHeight-124 : 200}px`
}
async function loadTable() {
  const kitchenMap = new Map()
  let res = await fetch(`${base_api}/kitchens`)
  let data = await res.json()
  data.result.forEach(kitchen => {
    kitchenMap.set(kitchen.kitchen_id.S, kitchen.kitchen_name.S)
  })
  if (type === 'notifications') res = await fetch(`${base_api}/all_orders`)
  else res = await fetch(`${base_api}/sms_all_orders`)
  data = await res.json()
  let rowData = []
  data.Items.forEach(item => {
    rowData.push({
      name: item.name.S,
      email: item.email.S,
      phone: item.phone.S,
      address: item.street.S,
      city: item.city.S,
      kitchen: kitchenMap.get(item.kitchen_id.S),
      zipCode: item.zipCode.N,
      n_orders: item.number_of_orders.S,
      order_id: item.order_id.S,
      first_order: item.created_at.S.slice(0, 10),
      last_order: item.last_order_date.S.slice(0, 10),
      appVersion: item.appVersion ? item.appVersion.S : '-'
    })
  })
  rowData.forEach(row => {
    row.zipCode = parseInt(row.zipCode)
    row.n_orders = parseInt(row.n_orders)
  })
  grid.gridOptions.api.setRowData(rowData)
}
async function loadGroups() {
  let res = await fetch(`${base_api}/saved_notification_group`)
  let data = await res.json()
  savedGroups = data.Items
}
function openGroups() {
  let groups = savedGroups.filter(group => group.group_name.S.indexOf('HISTORY_ID') === -1)
  let modalBody = document.querySelector('#savedGroups')
  modalBody.innerHTML = `<div class='list-group'>
    ${groups.map(group => `<div class='list-group-item list-group-item-action d-flex justify-content-between'
    onclick='selectGroup("${group.group_name.S}")'>
      ${group.group_name.S}
      <i class='btn fas fa-times' onclick='deleteGroup("${group.group_id.S}")'></i>
    </div>`).join('')}
    ${groups.length === 0 ? 'No saved groups' : ''}
  </div>`
}
function selectGroup(name) {
  let customers = []
  for (let group of savedGroups) {
    if (group.group_name.S === name) customers = group.customers.L
  }
  customers = customers.map(item => item.S)
  let nodes = []
  grid.gridOptions.api.forEachNode((node, index) => {
    if (customers.indexOf(node.data.order_id) !== -1) {
      nodes.push(node)
    }
    node.setSelected(false)
  })
  nodes.forEach(node => {
    node.setSelected(true)
  })
}
async function deleteGroup(group_id) {
  let formData = new FormData()
  formData.append('group_id', group_id)
  await fetch(`${base_api}/delete_saved_notification_group`, {
    method: 'POST',
    body: formData
  })
  await loadGroups()
  openGroups()
}
function saveGroup() {
  let recipients = grid.gridOptions.api.getSelectedNodes()
  if (recipients.length === 0) return
  recipients = recipients.map(node => {
    return {
      'S': node.data.order_id
    }
  })
  let name = prompt('Enter a group name:')
  if (name === '' || name === null || savedGroups.map(group => group.group_name).indexOf(name) !== -1) return
  fetch(`${base_api}/saved_notification_group`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      group_name: name,
      customers: recipients
    })
  }).then(openGroups)
}
async function loadMessages() {
  let res = await fetch(`${base_api}/saved_notification_message`)
  let data = await res.json()
  savedMessages = data.Items
}
function openMessages() {
  let messages = savedMessages.filter(msg => msg.message_name.S.indexOf('HISTORY_ID') === -1)
  let modalBody = document.querySelector('#savedMessages')
  modalBody.innerHTML = `<div class='list-group'>
    ${messages.map(msg => `<div class='list-group-item list-group-item-action d-flex justify-content-between'
    onclick='selectMessage(\`${msg.message_payload.S}\`)'>
      ${msg.message_name.S}
      <i class='btn fas fa-times' onclick='deleteMessage("${msg.message_id.S}")'></i>
    </div>`).join('')}
    ${messages.length === 0 ? 'No saved messages' : ''}
  </div>`
}
async function deleteMessage(message_id) {
  let formData = new FormData()
  formData.append('message_id', message_id)
  await fetch(`${base_api}/delete_saved_notification_message`, {
    method: 'POST',
    body: formData
  })
  await loadMessages()
  openMessages()
}
function selectMessage(msg) {
  let textBox = document.querySelector('#myTextBox')
  textBox.value = msg
  updateValidity()
}
function saveMessage() {
  let msg = document.querySelector('#myTextBox').value
  if (msg === '') return
  let name = prompt('Enter message name:')
  let formData = new FormData()
  formData.append('message_name', name)
  formData.append('message_payload', msg)
  fetch(`${base_api}/saved_notification_message`, {
    method: 'PUT',
    body: formData
  }).then(() => loadMessages().then(openMessages))
}
async function saveHistory() {
  let history_id = Math.random().toString(36).substr(2, 9)
  let name = `HISTORY_ID(${history_id})`
  let recipients = grid.gridOptions.api.getSelectedNodes().map(node => {
    return {
      'S': node.data.order_id
    }
  })
  await fetch(`${base_api}/saved_notification_group`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      group_name: name,
      customers: recipients
    })
  })
  await loadGroups()
  let msg = document.querySelector('#myTextBox').value
  let formData = new FormData()
  formData.append('message_name', name)
  formData.append('message_payload', msg)
  await fetch(`${base_api}/saved_notification_message`, {
    method: 'PUT',
    body: formData
  })
  await loadMessages()
}
function openHistory() {
  let messages = savedMessages.filter(msg => msg.message_name.S.indexOf('HISTORY_ID') !== -1)
  let groups = savedGroups.filter(group => group.group_name.S.indexOf('HISTORY_ID') !== -1)
  let history = []
  messages.forEach(msg => {
    let matchingGroups = groups.filter(group => group.group_name.S === msg.message_name.S)
    history.push([msg, matchingGroups[0]])
  })
  let modalBody = document.querySelector('#history')
  modalBody.innerHTML = `<div class='list-group'>
    ${history.map(entry => `<div class='list-group-item list-group-item-action'
    onclick='selectHistory("${entry[0].message_payload.S}", "${entry[1].group_name.S}")'>
      ${entry[0].created_date.S}
      "${entry[0].message_payload.S}"
      <i class='btn fas fa-times float-right' onclick='deleteHistory("${entry[0].message_id.S}", "${entry[1].group_id.S}")'></i>
    </div>`).join('')}
    ${messages.length === 0 ? 'No history' : ''}
  </div>`
}
async function deleteHistory(message_id, group_id) {
  await deleteMessage(message_id)
  await deleteGroup(group_id)
  openHistory()
}
function selectHistory(msg, group) {
  selectMessage(msg)
  selectGroup(group)
}
function sendMessage() {
  let message = document.querySelector('#myTextBox').value
  let recipients = grid.gridOptions.api.getSelectedNodes()
  if (message === '' || recipients.length === 0) return
  let emails = []
  for (let node of recipients) {
    let email = `email_${node.data.email.toLowerCase()}`
    if (emails.indexOf(email) === -1) emails.push(email)
  }
  const formData = new FormData()
  formData.append('tags', emails.join(','))
  formData.append('message', message)
  fetch(`${base_api}/send_notification`, {
    method: 'POST',
    body: formData
  })
  saveHistory()
  updateValidity(false)
  alert('Message sent successfully')
}
function sendToAll() {
  let message = document.querySelector('#myTextBox').value
  if (message === '') return
  const formData = new FormData()
  formData.append('tags', 'default')
  formData.append('message', message)
  fetch(`${base_api}/send_notification`, {
    method: 'POST',
    body: formData
  })
  saveHistory()
  updateValidity(false)
  alert('Message sent successfully')
}
function formatPhoneNumber(number) {
  let formattedNumber = ''
  for (let char of number) {
    if (char.match(/[0-9]/)) formattedNumber += char
  }
  if (formattedNumber.length === 10) formattedNumber = '+1'+formattedNumber
  else formattedNumber = '+'+formattedNumber
  return formattedNumber
}
function sendSMS() {
  let message = document.querySelector('#myTextBox').value
  let recipients = grid.gridOptions.api.getSelectedNodes()
  if (message === '' || recipients.length === 0) return
  let phones = []
  for (let node of recipients) {
    let number = formatPhoneNumber(node.data.phone)
    if (phones.indexOf(number) === -1) phones.push(number)
  }
  const formData = new FormData()
  formData.append('recipients', phones.join(','))
  formData.append('message', message)
  fetch(`${base_api}/send_twilio_sms`, {
    method: 'POST',
    body: formData
  })
  saveHistory()
  updateValidity(false)
  alert('Message sent successfully')
}
function sendSMSToAll() {
  let message = document.querySelector('#myTextBox').value
  let phones = []
  grid.gridOptions.api.forEachNode((node, idx) => {
    let number = node.data.phone
    if (number.length === 10) number = '+1'+number
    if (phones.indexOf(number) === -1) phones.push(number)
  })
  const formData = new FormData()
  formData.append('recipients', phones.join(','))
  formData.append('message', message)
  fetch(`${base_api}/send_twilio_sms`, {
    method: 'POST',
    body: formData
  })
  saveHistory()
  updateValidity(false)
  alert('Message sent successfully')
}
function updateValidity(validity) {
  let msgValid = document.querySelector('#myTextBox').value !== ''
  let recipientsValid = grid.gridOptions.api.getSelectedNodes().length > 0
  let invalid = validity === false
  document.querySelector('#send').className = 'btn btn-secondary ' +
    (!msgValid || !recipientsValid ||invalid ? 'disabled' : '')
  document.querySelector('#sendAll').className = 'btn btn-secondary ' +
    (!msgValid || invalid ? 'disabled' : '')
  document.querySelector('#saveGroup').className = 'btn btn-secondary ' +
    (!recipientsValid || invalid ? 'disabled' : '')
  document.querySelector('#saveMessage').className = 'btn btn-secondary ' +
    (!msgValid || invalid ? 'disabled' : '')
}

window.onresize = resize
window.onload = () => {
  let gridElement = document.querySelector('#notificationGrid')
  if (gridElement !== null) {
    type = 'notifications'
    grid = new agGrid.Grid(gridElement, {
      onGridReady: params => gridApi = params.api,
      onSelectionChanged: updateValidity,
      columnDefs: colDefs,
      rowData: [],
      defaultColDef: {resizable: true },
      groupSelectsFiltered: true,
      groupUseEntireRow: true,
      rowSelection: 'multiple'
    })
  } else {
    type = 'sms'
    gridElement = document.querySelector('#smsGrid')
    grid = new agGrid.Grid(gridElement, {
      onGridReady: params => gridApi = params.api,
      onSelectionChanged: updateValidity,
      columnDefs: colDefs,
      rowData: [],
      defaultColDef: {resizable: true },
      groupSelectsFiltered: true,
      groupUseEntireRow: true,
      rowSelection: 'multiple'
    })
  }
  resize()
  loadTable()
  loadGroups()
  loadMessages()
  updateValidity()
}
