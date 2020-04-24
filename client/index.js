import Web3 from 'web3';
import MyShop from '../build/contracts/MyShop.json';

let web3;
let myShop;

const initWeb3 = () => {
  return new Promise((resolve, reject) => {
    // New metamask
    if(typeof window.ethereum !== 'undefined') {
      window.ethereum.enable().then(() => {
        resolve(
          new Web3(window.ethereum)
      );
      })
      .catch(e => {
        reject(e);
      });
      return;
    }
    // Old metamask
    if(typeof window.web3 !== 'undefined') {
      return resolve(
      new Web3(window.web3.currentProvider)
    );
    }
    // No metamask, go to Ganache
    resolve(new Web3('localhost:7545'));
  });
};

const initContract = () => {
  const contractNetworks = Object.keys(
    MyShop.networks)[0];
  return new web3.eth.Contract(
    MyShop.abi, MyShop.networks[contractNetworks].address);
};

const initApp = async function() {

  const $addItem = document.getElementById("addItem");
  let accounts = [];
  let allInv = [];
  let allId = [];
  let allName = [];
  let allDesc = [];
  let allPrice = [];
  let button;

  //gets a list of all items' IDs
  const upListItems = await myShop.methods.listItems().call();

  //repeats loop for all existing items
  for (var i=0; i < upListItems.length; i++) {

    //gets all details from the array upListItems[i]
    var allItems = await myShop.methods.items(upListItems[i]).call();

    //appends the list as a HTML list
    var li = document.createElement("li");
    allId[i] = allItems.itemID;
    allName[i] = allItems.itemName;
    allDesc[i] = allItems.description;
    allInv[i] = allItems.inventory;
    allPrice[i] = allItems.price;
    var itemDetails = `ID: ${allId[i]}
    Name: ${allName[i]}
    Description: ${allDesc[i]}
    Inventory: ${allInv[i]}
    Price (wei): ${allPrice[i]}`;
    var t = document.createTextNode(itemDetails);
    li.className = "listLI";
    li.appendChild(t);
    document.getElementById("listItemsUL").appendChild(li);

    //if item inventory is more than 0, create a "Buy" button
    if (allInv[i] > 0) {
      button = document.createElement("button");
      var txt = document.createTextNode("Buy");
      button.className = "btn btn-primary btn-sm float-right";
      button.id = allId[i];
      button.appendChild(txt);
      li.appendChild(button);
    }
  };

  web3.eth.getAccounts().then(_accounts => {
    accounts = _accounts;
  });

  //creates a list of registered buyers
  const getBuyers = await myShop.getPastEvents("NewBuyer", {
    fromBlock: 0, toBlock: 'latest'
  });
  for (var i=0; i < getBuyers.length; i++) {
    var li = document.createElement("li");
    var newBuyerName = getBuyers[i].returnValues[0];
    var newBuyerEmail = getBuyers[i].returnValues[1];
    var newBuyerAddr = getBuyers[i].returnValues[2];
    var buyerDetails = `Name: ${newBuyerName}
    Email: ${newBuyerEmail}
    Address: ${newBuyerAddr}`;
    var t = document.createTextNode(buyerDetails);
    li.className = "buyerLI";
    li.appendChild(t);
    document.getElementById("regEventsList").appendChild(li);
  };

  //creates a list of registered orders
  const getOrders = await myShop.getPastEvents("NewOrder", {
    fromBlock: 0, toBlock: 'latest'
  });
  for (var i=0; i < getOrders.length; i++) {
    var li = document.createElement("li");
    var newOrderId = getOrders[i].returnValues[0];
    var newOrderItem = getOrders[i].returnValues[1];
    var newOrderQty = getOrders[i].returnValues[2];
    var newOrderAddr = getOrders[i].returnValues[3];
    var orderDetails = `Order ID: ${newOrderId}
    Item ID: ${newOrderItem}
    Quantity: ${newOrderQty}
    From: ${newOrderAddr}`;
    var t = document.createTextNode(orderDetails);
    li.className = "orderLI";
    li.appendChild(t);
    document.getElementById("orderListUL").appendChild(li);
  };

  //fires BuyItem method when buy button is clicked
  $( ".float-right" ).on( "click", async function() {
    const buttonId = $(this).attr("id");
    const getPrice = await myShop.methods.items(buttonId).call();
    // console.log(getPrice.price);
    myShop.methods.BuyItem(buttonId, 1)
      .send({from: accounts[0], value: getPrice.price})
  })

  //sets #addItemDiv to dialog and hides it
  $( "#addItemDiv" ).dialog({
    autoOpen: false, modal: true, width: "50%"
  });

  // opens the #addItemDiv dialog when #addItemBtn is clicked
  $( "#addItemBtn" ).click(function() {
    $( "#addItemDiv" ).dialog( "open" );
  });

  //toggles visibility of #regEventsDiv when the "Show/Hide" button is clicked
  $( "#buyerRegBtn" ).on( "click" , function() {
    $( "#regEventsDiv" ).toggle();
  });

  //toggles visibility of #listItems and #listOrders when the "Show orders"
  //button is clicked
  $( "#switchOrderItemBtn" ).on( "click" , function() {
    var self = $(this);
    if( self.text() == 'Show orders' )     {
   	 self.html('Show items');
    }
    else {
   	 self.html('Show orders');
    }
    $( "#listItems" ).toggle();
    $( "#listOrders" ).toggle();
  });

  //function to register a new item
  $addItem.addEventListener('submit', e => {
    e.preventDefault();
    const itemId = e.target.elements[0].value;
    const itemName = e.target.elements[1].value;
    const itemDesc = e.target.elements[2].value;
    const itemInvent = e.target.elements[3].value;
    const itemPrice = e.target.elements[4].value;
    myShop.methods.addItem(itemId, itemName, itemDesc, itemInvent, itemPrice)
    .send({from: accounts[0]})
    .then(() => {
      var li = document.createElement("li");
      var itemDetails = `ID: ${itemId}
      Name: ${itemName}
      Description: ${itemDesc}
      Inventory: ${itemInvent}
      Price (wei): ${itemPrice}`;
      var t = document.createTextNode(itemDetails);
      li.className = "listLI";
      li.appendChild(t);
      document.getElementById("listItemsUL").appendChild(li);

      //if item inventory is more than 0, create a "Buy" button
      if (itemInvent > 0) {
          var button = document.createElement("button");
          var txt = document.createTextNode("Buy");
          button.className = "btn btn-primary btn-sm float-right";
          button.id = itemId;
          button.appendChild(txt);
          li.appendChild(button);
      }
    })
    .then(() => {
      $( "#addItemDiv" ).dialog( "close" );
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initWeb3().then(_web3 => {
    web3 = _web3;
    myShop = initContract();
    initApp();
  }).catch(e => console.log(e.message));
});
