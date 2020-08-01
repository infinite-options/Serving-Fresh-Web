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
  {headerName: 'Last Order', field: 'last_order'}
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
      last_order: item.last_order_date.S.slice(0, 10)
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
  loadGroups().then(() => {
    let modalBody = document.querySelector('#savedGroups')
    modalBody.innerHTML = `<div class='list-group'>
      ${savedGroups.map(group => `<div class='list-group-item list-group-item-action d-flex justify-content-between'
      onclick='selectGroup("${group.group_name.S}")'>
        ${group.group_name.S}
        <i class='btn fas fa-times' onclick='deleteGroup("${group.group_id.S}")'></i>
      </div>`).join('')}
      ${savedGroups.length === 0 ? 'No saved groups' : ''}
    </div>`
  })
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
  })
  let alreadySelected = true
  nodes.forEach(node => {
    if (!node.selected) alreadySelected = false
    node.setSelected(true)
  });
  if (alreadySelected) nodes.forEach(node => {
    node.setSelected(false)
  })
}
function deleteGroup(group_id) {
  let formData = new FormData()
  formData.append('group_id', group_id)
  fetch(`${base_api}/delete_saved_notification_group`, {
    method: 'POST',
    body: formData
  }).then(openGroups)
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
  loadMessages().then(() => {
    let modalBody = document.querySelector('#savedMessages')
    modalBody.innerHTML = `<div class='list-group'>
      ${savedMessages.map(msg => `<div class='list-group-item list-group-item-action d-flex justify-content-between'
      onclick='selectMessage("${msg.message_payload.S}")'>
        ${msg.message_name.S}
        <i class='btn fas fa-times' onclick='deleteMessage("${msg.message_id.S}")'></i>
      </div>`).join('')}
      ${savedMessages.length === 0 ? 'No saved messages' : ''}
    </div>`
  })
}
function deleteMessage(message_id) {
  let formData = new FormData()
  formData.append('message_id', message_id)
  fetch(`${base_api}/delete_saved_notification_message`, {
    method: 'POST',
    body: formData
  }).then(openMessages)
}
function selectMessage(msg) {
  let textBox = document.querySelector('#myTextBox')
  if (textBox.value === msg) textBox.value = ''
  else textBox.value = msg
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
  }).then(openMessages)
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
  document.querySelector('#myTextBox').value = ''
  updateValidity()
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
  document.querySelector('#myTextBox').value = ''
  updateValidity()
  alert('Message sent successfully')
}
function sendSMS() {
  let message = document.querySelector('#myTextBox').value
  let recipients = grid.gridOptions.api.getSelectedNodes()
  if (message === '' || recipients.length === 0) return
  let phones = []
  for (let node of recipients) {
    let number = node.data.phone
    if (number.length === 10) number = '+1'+number
    if (phones.indexOf(number) === -1) phones.push(number)
  }
  const formData = new FormData()
  formData.append('recipients', phones.join(','))
  formData.append('message', message)
  fetch(`${base_api}/send_twilio_sms`, {
    method: 'POST',
    body: formData
  })
  document.querySelector('#myTextBox').value = ''
  updateValidity()
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
  document.querySelector('#myTextBox').value = ''
  updateValidity()
  alert('Message sent successfully')
}
function updateValidity(type) {
  let msgValid = document.querySelector('#myTextBox').value !== ''
  let recipientsValid = grid.gridOptions.api.getSelectedNodes().length > 0
  document.querySelector('#send').className = 'btn btn-secondary ' +
    (!msgValid || !recipientsValid ? 'disabled' : '')
  document.querySelector('#sendAll').className = 'btn btn-secondary ' +
    (!msgValid ? 'disabled' : '')
  document.querySelector('#saveGroup').className = 'btn btn-secondary ' +
    (!recipientsValid ? 'disabled' : '')
  document.querySelector('#saveMessage').className = 'btn btn-secondary ' +
    (!msgValid ? 'disabled' : '')
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
    resize()
    loadTable()
    updateValidity()
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
    resize()
    loadTable()
    updateValidity()
  }
}
