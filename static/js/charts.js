//Resendiz: 912592ed119046a08fad104bef0c3e70
//Esquivel: 6b4c1557208649d9b4f5450d8a98a398
let globalCustomerData;
let globalOrderData;
let globalID;

let kitchenInfo = [
    {
        name: 'Resendiz',
        id: '912592ed119046a08fad104bef0c3e70',
    },
    {
        name: 'Esquivel',
        id: '6b4c1557208649d9b4f5450d8a98a398',
    },
]

let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"]

function getData (data){
    console.log('Total number of orders: ', data.length);
    console.log(data);
    globalOrderData = data;
    let customers = [];
    sortOrdersByDate(data);
    data.forEach((data) => {
        //if this is a new customer we've never seen, push into array
        if(customers.findIndex((customer) => (data.email.S.toLowerCase().trim() === customer.email.toLowerCase().trim() )) === -1){
            customers.push({
                name: data.name.S,
                email: data.email.S.toLowerCase(),
                zipCode: data.zipCode.N,
                totalNumOfOrder: 1,
                kitchens:[],
            });
            let indexOfCustomer = customers.findIndex((customer) => (data.email.S.toLowerCase().trim()  === customer.email.toLowerCase().trim() ))
            customers[indexOfCustomer].kitchens.push({
                id: data.kitchen_id.S,
                numOfOrdersFromKitchen: 1,
                time: [],
            })
            //console.log(customers[indexOfCustomer])
            let indexOfKitchen = customers[indexOfCustomer].kitchens.findIndex((kitchen) => (data.kitchen_id.S === kitchen.id))
            
            customers[indexOfCustomer].kitchens[indexOfKitchen].time.push({
                month:data.created_at.S.substr(0,7),
                numOfOrdersDuringMonth: 1,
            })
        }
        else{
            //this is a returning customer, find
            let indexOfCustomer = customers.findIndex((customer) => (data.email.S.toLowerCase().trim()  === customer.email.toLowerCase().trim() ))
            customers[indexOfCustomer].totalNumOfOrder += 1;
            //see if they have ordered from cuurent kitchen
            if(customers[indexOfCustomer].kitchens.findIndex((kitchen) => (data.kitchen_id.S === kitchen.id)) === -1){
                //this is first time ordering from this kitchen, push new kitchen object
                customers[indexOfCustomer].kitchens.push({
                    id: data.kitchen_id.S,
                    numOfOrdersFromKitchen: 1,
                    time: [],
                })
                let indexOfKitchen = customers[indexOfCustomer].kitchens.findIndex((kitchen) => (data.kitchen_id.S === kitchen.id))
                //add time of the order
                customers[indexOfCustomer].kitchens[indexOfKitchen].time.push({
                    month: data.created_at.S.substr(0,7),
                    numOfOrdersDuringMonth: 1,
                })
            }
            else{
                //this is a returning order to this kitchen, find their kitchen data
                let indexOfKitchen = customers[indexOfCustomer].kitchens.findIndex((kitchen) => (data.kitchen_id.S === kitchen.id))
                
                let timeIndex = customers[indexOfCustomer].kitchens[indexOfKitchen].time.findIndex((time) => data.created_at.S.substr(0,7) === time.month)
                if(timeIndex === -1){
                    //if customer orders for the first time this month, push new time object
                    customers[indexOfCustomer].kitchens[indexOfKitchen].time.push({
                        month: data.created_at.S.substr(0,7),
                        numOfOrdersDuringMonth: 1,
                    })
                    customers[indexOfCustomer].kitchens[indexOfKitchen].numOfOrdersFromKitchen += 1;
                }
                else{
                    //this is not the first time customer is ordering from this kitchen this month
                    customers[indexOfCustomer].kitchens[indexOfKitchen].time[timeIndex].numOfOrdersDuringMonth += 1;
                    customers[indexOfCustomer].kitchens[indexOfKitchen].numOfOrdersFromKitchen += 1;
                }
            }
        }
    })
    customers.sort((a,b) => a.totalNumOfOrder - b.totalNumOfOrder);
    //sorting time array
    customers.forEach((customer) => {
        //customersArray.sort((a,b) => a.number_of_orders - b.number_of_orders)
        customer.kitchens.forEach((kitchen) => {
            if(kitchen.time.length >= 2){
                kitchen.time.sort((a, b) => {
                    let p1 = a.month.toLowerCase();
                    let p2 = b.month.toLowerCase();
                    if (p1 < p2) {
                        return -1;
                    }
                    if (p1 > p2) {
                        return 1;
                    }
                    return 0;
                });
            }
        })
    })
    globalCustomerData = customers
    console.log(globalCustomerData)
}
function printGraph(customers){
    //set date in end calender
    printCustomerVsOrderGraph(customers)
    let kitchenID = document.getElementById('typeOfGraph').value;
    if(kitchenID === "ByDay"){
        console.log('About to print')
        printDayVsOrderGraph(customers);
    } 
    //displays customer vs number of order graph
    if(document.getElementById('typeOfGraph').value !== "ByDay"){
        document.getElementById("fullDateContainer").style.display = "none";
        document.getElementById("halfDateContainer").style.display = "inline-block";
        document.getElementById("kitchenSelectContainer").style.display = "none";
    }
    //disaplys date vs number of order
    if(document.getElementById('typeOfGraph').value === "ByDay"){
        document.getElementById("fullDateContainer").style.display = "inline-block";
        document.getElementById("halfDateContainer").style.display = "none";
        document.getElementById("kitchenSelectContainer").style.display = "inline-block";

    }
}

function printCustomerVsOrderGraph(customers){
    //Esquivel: 6b4c1557208649d9b4f5450d8a98a398
    customers = globalCustomerData
    console.log(customers)
    let customerList = [];
    let yValues = [];
    let now = new Date();
    let start = document.getElementById('halfDateStartCalender').value
    let end = document.getElementById('halfDateEndCalender').value

    if(end === ""){
        //if user uses the default end value 
        let monthString1 = now.getMonth().toString()
        if(now.getMonth() < 10){
            monthString1 = '0' + now.getMonth().toString()
            console.log(monthString1)
        }
        endDateObject = new Date(now.getFullYear().toString(), monthString1)
        endDateObject.setMonth(endDateObject.getMonth() + 1)
    }
    else{
        endDateObject = new Date(end.substr(0,4), end.substr(5,2))
    }
    let startDateObject = new Date(start.substr(0,4), start.substr(5,2))
    
    console.log('Start: '+ startDateObject)
    console.log('End: '+ endDateObject)
    //creates all time frames and adds into yValues
    for (startDateObject; startDateObject <= endDateObject; startDateObject.setMonth(startDateObject.getMonth() + 1)) {
        let yearString = startDateObject.getFullYear();
        let monthInt = parseInt(startDateObject.getMonth());
        let monthString = monthInt.toString();
        if(monthInt < 10){
            monthString = '0' + monthInt.toString();
        }
        let date = yearString + '-' + monthString;
        
        console.log(date)
        yValues.push({
            name: date,
            data: [],
        })
    }
    yValues.reverse();
    console.log(yValues);
    let graphTitle;
    let kitchenID = document.getElementById('typeOfGraph').value;
    if(kitchenID === "all"){
        //sets up graph that displays orders from all kitchens
        graphTitle = "All Kitchens"
        //loop through each customer and check if we should add thier names into array. This depends on if user has ordered within the given time frame
        let customerArray = []
        customers.forEach((customer) => {
            //check if customer has ordered within the given time frame. Time frame is in yValues.date
            let didCustomerOrder = false
            yValues.forEach((month) => {
                //console.log(month.name)
                customer.kitchens.forEach((kitchen) => {
                    const found = kitchen.time.some(time => time.month === month.name);
                    if(found === true){
                        didCustomerOrder = true 
                    }
                })
            })
            //if customer did order within the time frame, add name to array and calculate their total # order each month
            if(didCustomerOrder){
                //customerList.push(customer.name);
                let totalOrder = 0
                let eachMonth = []
                for(let i = 0; i < yValues.length; i++){
                    let totalOrdersThisMonth = 0;
                    customer.kitchens.forEach((kitchen) => {
                        kitchen.time.forEach((time) => {
                            if(time.month === yValues[i].name){
                                totalOrdersThisMonth += time.numOfOrdersDuringMonth;
                                
                            }
                        })
                    })
                    totalOrder += totalOrdersThisMonth;
                    eachMonth.push({
                        month: yValues[i].name,
                        numberOfOrder: totalOrdersThisMonth,
                    })
                }
                customerArray.push({
                    name: customer.name,
                    totalNumberOfOrders: totalOrder,
                    ordersEachMonth: eachMonth,
                })
            }
        })
        customerArray.sort((a,b) => a.totalNumberOfOrders - b.totalNumberOfOrders);
        console.log(customerArray)
        console.log('# of customers: ' + customerList.length)
        customerArray.forEach((customer) => {
            customerList.push(customer.name);
            for(let i = 0; i < yValues.length; i++){
                customer.ordersEachMonth.forEach((eachMonth) => {
                    if(eachMonth.month === yValues[i].name)
                        yValues[i].data.push(eachMonth.numberOfOrder)
                })
            }
        })
        console.log(customerList)
        console.log(yValues)
    }
    else{  
        //this is setting up graphs for specific kithens
        let kitchenID = document.getElementById('typeOfGraph').value;
        if(kitchenID === "6b4c1557208649d9b4f5450d8a98a398") graphTitle = "Esquivel Customers"
        if(kitchenID === "912592ed119046a08fad104bef0c3e70") graphTitle = "Resendiz Customers"

        console.log('ID is: ' + kitchenID);
        globalID = kitchenID;
        let customerArray = []
        customers.forEach((customer) => {

            //check if customer has ordered from correct kitchen during giving time
            let didCustomerOrder = false
            yValues.forEach((month) => {
                customer.kitchens.forEach((kitchen) => {
                    let kitchenFound = false
                    if(kitchen.id === kitchenID)
                        kitchenFound = true
                    const timeFound = kitchen.time.some(time => time.month === month.name);
                    if(timeFound === true && kitchenFound === true)
                        didCustomerOrder = true 
                })
            })
            let kitchenIndex = customer.kitchens.findIndex((kitchen) => kitchen.id === kitchenID)

            if((kitchenIndex != -1 && kitchenIndex != undefined) && didCustomerOrder === true){    
                let totalOrder = 0
                let eachMonth = []
                //loop through each time slot
                for(let i = 0; i < yValues.length; i++){
                    let totalOrdersThisMonth = 0;
                    customer.kitchens.forEach((kitchen) => {
                        kitchen.time.forEach((time) => {
                            if(time.month === yValues[i].name && kitchen.id === kitchenID){
                                totalOrdersThisMonth += time.numOfOrdersDuringMonth;
                            }
                        })
                    })
                    
                    totalOrder += totalOrdersThisMonth;
                    eachMonth.push({
                        month: yValues[i].name,
                        numberOfOrder: totalOrdersThisMonth,
                    })
                }
                customerArray.push({
                    name: customer.name,
                    totalNumberOfOrders: totalOrder,
                    ordersEachMonth: eachMonth,
                })
            }
        })


        //sort customers by number of orders
        customerArray.sort((a,b) => a.totalNumberOfOrders - b.totalNumberOfOrders);
        console.log(customerArray)
        customerArray.forEach((customer) => {
            //add customer name to x-axis array
            customerList.push(customer.name);
            for(let i = 0; i < yValues.length; i++){
                customer.ordersEachMonth.forEach((eachMonth) => {
                    if(eachMonth.month === yValues[i].name)
                        yValues[i].data.push(eachMonth.numberOfOrder)
                })
            }
        })
        console.log(customerList)
        console.log(yValues)
    }
   //displays graph
    $(document).ready(function() {  
        var chart = {
           type: 'column',
           backgroundColor: 'white',
        };
        var title = {
           text: graphTitle,   
        };
        var subtitle = {
           text: ''  
        };
        var xAxis = {
           categories: customerList,
           title: {
              text: 'Customers'
           },
            labels: {
                rotation: -90,
            }
        };
        var yAxis = {
           min: 0,
           title: {
              text: 'Number of Orders',
              align: 'high'
           },
           labels: {
              overflow: 'justify'
           },
           stackLabels: {
            enabled: true,
            style: {
                fontWeight: 'bold',
                color: ( // theme
                    Highcharts.defaultOptions.title.style &&
                    Highcharts.defaultOptions.title.style.color
                ) || 'gray'
            }
            }
        };
        var tooltip = {
           valueSuffix: ''
        };
        var plotOptions = {
           bar: {
              dataLabels: {
                 enabled: true
              }
           },
           column: {
               stacking: 'normal',
               dataLabels: {
                   enabled: true
                },
            }
        };
        var legend = {
           backgroundColor: (
              (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                 '#FFFFFF'),
           shadow: true
        };
        var credits = {
           enabled: false
        };
        var series = yValues;
        
        var json = {};   
        json.chart = chart; 
        json.title = title;   
        json.subtitle = subtitle; 
        json.tooltip = tooltip;
        json.xAxis = xAxis;
        json.yAxis = yAxis;  
        json.series = series;
        json.plotOptions = plotOptions;
        json.legend = legend;
        json.credits = credits;
        $('#container').highcharts(json);
     });
     /*
    let yValues = [{
        name: 'July',
        data: [0, 3,7],
    }, {
        name: 'June',
        data: [2, 2, 3],
    }, {
        name: 'May',
        data: [],
    }]
    ---------------------------
    let yValues = [{
        name: 'Esquivel',
        id:
        data: [0, 3,7],
    }, {
        name: 'Resendiz',
        data: [2, 2, 3],
    }, {
        name: 'May',
        data: [],
    }]
    */
}

function printDayVsOrderGraph(customers){
    //Esquivel: 6b4c1557208649d9b4f5450d8a98a398
    orders = globalOrderData
    let days = []
    let yValues = []
    let now = new Date();
    console.log(now)
    //create x-axis labels, we want each day to have a bar
    
    //get dates from date selection
    let start = document.getElementById('startCalender').valueAsDate
    let end = document.getElementById('endCalender').valueAsDate
    end.setDate(end.getDate() + 1)
    for (start; start <= end; start.setDate(start.getDate() + 1)) {
        //console.log(start.getDate())
        let month = parseInt(start.getMonth());
        month += 1;
        let day = parseInt(start.getDate())
        if(day < 10){
            day = '0' + day.toString()
        }
        if(month < 10){
            month = '0' + month.toString();
        }
        let date = month + '-' + day +  ' ' + dayNames[start.getDay()];
        //console.log(date)
        days.push(date)
    }
    console.log(days)

    //fill out yValues, get name and id of each kitchen and palce into
    for(let kitchenIndex=0; kitchenIndex < kitchenInfo.length; kitchenIndex++){
        let form = document.getElementById("myForm")
        for (let formIndex = 0; formIndex < form.elements.length; formIndex++ ){
            if (form.elements[formIndex].type == 'checkbox' && form.elements[formIndex].checked == true & form.elements[formIndex].id == kitchenInfo[kitchenIndex].id){
                console.log('Push')
                yValues.push({
                    name: kitchenInfo[kitchenIndex].name,
                    id: kitchenInfo[kitchenIndex].id,
                    data: [],
                })
            }
        }
    }
         
    //loop through each day in day array
    days.forEach((day) => {
        for(let i=0; i< yValues.length; i++){
            let totalOrdersToday = 0;
            //loop through each order to find orders created on certain day and certain restaurant
            for(let ordersIndex=0; ordersIndex < orders.length; ordersIndex++){
                if(orders[ordersIndex].created_at.S.substr(5,5) === day.substr(0,5) && orders[ordersIndex].kitchen_id.S === yValues[i].id){
                    totalOrdersToday += 1;
                }   
            }
            yValues[i].data.push(totalOrdersToday)
        }

    })
    console.log(yValues)
    //console.log(yValues)
    /*
    let yValues = [{
        name: 'Esquivel',
        id:
        data: [0, 3,7],
    }, {
        name: 'Resendiz',
        data: [2, 2, 3],
    }, {
        name: 'May',
        data: [],
    }]
    */
    //displays graph
    $(document).ready(function() {  
        var chart = {
           type: 'column'
        };
        var title = {
           text: 'Number of Orders Per Day'   
        };
        var subtitle = {
           text: ''  
        };
        var xAxis = {
           categories: days,
           crosshair: true,
           labels: {
               rotation: -90
           }
        };
        var yAxis = {
            min: 0,
            title: {
               text: 'Number of Orders',
               align: 'high'
            },
            labels: {
               overflow: 'justify'
            },
            stackLabels: {
             enabled: true,
             style: {
                 fontWeight: 'bold',
                 color: ( // theme
                     Highcharts.defaultOptions.title.style &&
                     Highcharts.defaultOptions.title.style.color
                 ) || 'gray'
             }
             }
        };
        var tooltip = {
 
        };
        var plotOptions = {
            bar: {
               dataLabels: {
                  enabled: true
               }
            },
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true
                 },
             }
         };
         var legend = {
            backgroundColor: (
               (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                  '#FFFFFF'),
            shadow: true
         };
        var credits = {
           enabled: false
        };
        var series= yValues;
 
    
        var json = {};   
        json.chart = chart; 
        json.title = title;   
        json.subtitle = subtitle; 
        json.tooltip = tooltip;
        json.xAxis = xAxis;
        json.yAxis = yAxis;  
        json.series = series;
        json.plotOptions = plotOptions;  
        json.credits = credits;
        $('#container').highcharts(json);
     });
}
function sortOrdersByDate(data){
    data.sort((a,b) => {
        let p1 = a.created_at.S.toLowerCase();
        let p2 = b.created_at.S.toLowerCase();
                
        if (p1 < p2) {
            return -1;
        }
        if (p1 > p2) {
            return 1;
        }
        return 0;
    });
}

//sorts array by number of orders in kitchen
function compare(a, b) {
    // find index
    let kitchenIndexA = a.kitchens.findIndex((kitchen) => kitchen.id === globalID)
    let kitchenIndexB = b.kitchens.findIndex((kitchen) => kitchen.id === globalID)
    const A = a.kitchens[kitchenIndexA].numOfOrdersFromKitchen;
    const B = b.kitchens[kitchenIndexB].numOfOrdersFromKitchen;
    let comparison = 0;
    if (A > B) {
      comparison = 1;
    } else if (A < B) {
      comparison = -1;
    }
    return comparison;
  }

window.onload = function() {
    printGraph(globalCustomerData);
    //set end date to current
    document.getElementById('endCalender').valueAsDate = new Date();
    document.getElementById('halfDateEndCalender').valueAsDate = new Date();
};