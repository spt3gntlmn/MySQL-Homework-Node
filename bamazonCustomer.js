var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, results) => {
        if (err)
          return reject(err);
        resolve(results);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) {
          console.log("This is the error!");
          return reject(err);
        }
        resolve();
      });
    });
  }
}
let bamazon = new Database({
  host: "localhost",
  user: "root",
  password: "root",
  database: "bamazon"
});
start();
function start() {
  let bamaQuery = 'SELECT * FROM products';

  bamazon.query(bamaQuery).then(newQuery => {
    chooseQuestions(newQuery);
  })
}

function chooseQuestions(results) {
  let listOfIds = [];
  for (let i = 0; i < results.length; i++) {
    listOfIds.push(results[i].item_id.toString());
    console.log(`Id: ${results[i].item_id}, Item Name: ${results[i].product_name}, Price: ${results[i].price_retail}`);
  }
  inquirer.prompt([
    {
      type: "list",
      name: "productChoice",
      message: `would you like to purchase a product? Please, select one.`,
      choices: listOfIds
    },
    {
      type: "input",
      name: "qusntityRequested",
      message: "How many of this product are you requesting?"
    }]).then(function (res) {
      customerPurchaseRequest(res.productChoice, res.qusntityRequested);
    })

}

function customerPurchaseRequest(productChoice, qusntityRequested) {
  productChoice = parseInt(productChoice);
  qusntityRequested = parseInt(qusntityRequested);
  bamazon.query(`SELECT * FROM products WHERE item_id = ${productChoice}`).then(results => {
    let currentPurchaseTotal = results[0].product_sales;
    if (results[0].stock_quantity >= qusntityRequested) {
      let remainingStock = (results[0].stock_quantity - qusntityRequested);
      let productCost = (results[0].price_retail * qusntityRequested);
      let purchaseQty = (results[0].qty_purchaced + qusntityRequested)
      transactionCalc(results[0].product_name, productChoice, remainingStock, productCost, currentPurchaseTotal, purchaseQty, qusntityRequested)
    } else {
      console.log(`We're sorry, your request exceeds our onhad quantity in stock.  Please, try a quantity less than ${results[0].stock_quantity}.  Thank you!`.red);
      start();
    }
  })
}

function transactionCalc(item, productChoice, remainingStock, productCost, currentPurchaseTotal, purchaseQty, qusntityRequested) {
  bamazon.query(`Update products SET ? WHERE item_id = ${productChoice}`,
    {
      stock_quantity: remainingStock,
      product_sales: productCost + currentPurchaseTotal,
      qty_purchaced: purchaseQty
    }
  ).then(rows => {
    productCost = productCost.toFixed(2);
    console.log(`Congratualtions on you purchace of ${qusntityRequested} ${item}(s)!  The total product cost for your transaction is $${productCost}.`.green);
    start();
  })
}
