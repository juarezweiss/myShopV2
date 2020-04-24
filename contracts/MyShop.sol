pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

contract MyShop {

    address public owner;
    bool public paused;

    struct Item {
        uint itemID;
        string itemName;
        string description;
        uint inventory;
        uint price;
    }
    struct Buyer
    {
        string name;
        string email;
        string shipAddress;
    }
    struct Order {
        uint orderID;
        string email;
        string shipAddress;
    }

    mapping (address => Buyer) public buyers;
    mapping (uint => Item) public items;
    mapping (uint => Order) public orders;

    uint[] internal itemsList;
    uint[] internal ordersList;

    uint public numProducts;
    uint public numBuyers;
    uint public numOrders;

    // REMOVE WHEN PRODUCTION
    uint internal availableFunds;

    event NewItem(uint _itemID, string _itemName, string _description, uint
    _inventory, uint _price);
    event NewBuyer(string _name, string _email, string _shipAddress);
    event NewOrder(uint _orderID, uint itemID, uint _quantity, address _from);

    // First requirements of the contract:
    // Address of the owner must be specified
    constructor () public
    {
        owner = msg.sender;
    }

    // Modifier for functions that can only be ran by the owner
    modifier onlyOwner()
    {
        require(msg.sender==owner,"Only the owner can run this function.");
        _;
    }

    // Modifier for functions that can only be ran if not paused
    modifier pausable()
    {
        require(paused==false,"This contract is paused.");
        _;
    }

    // REMOVE WHEN PRODUCTION
    function getBalance() view public returns (uint) {
        return address(this).balance;
    }

    // Function to add a new item
    // Requirements:
    // msg.sender is the owner
    // Contract is not paused
    // itemID cannot be lower than 0
    function addItem(uint _itemID, string memory _itemName, string memory _description, uint
    _inventory, uint _price) public onlyOwner pausable
    {
        require(_itemID >= 0,"Item ID cannot be negative.");
        require(_itemID != items[_itemID].itemID,"The item ID already exists.");

        Item storage newItem = items[_itemID];
        newItem.itemID = _itemID;
        newItem.itemName = _itemName;
        newItem.description = _description;
        newItem.inventory = _inventory;
        newItem.price = _price;
        itemsList.push(_itemID);

        numProducts++;

        emit NewItem (_itemID, _itemName, _description, _inventory, _price);
    }

    // Function to update an existing item
    // Requirements:
    // msg.sender is the owner
    // Contract is not paused
    function updateItem(uint _itemID, string memory _itemName, string memory _description,
    uint _inventory, uint _price) public onlyOwner pausable
    {
        require(_itemID == items[_itemID].itemID,"The item does not exist.");

        items[_itemID].itemName = _itemName;
        items[_itemID].description = _description;
        items[_itemID].inventory = _inventory;
        items[_itemID].price = _price;
    }

    // Function to withdraw contract's funds to a specific address
    // Requirements:
    // msg.sender is the owner
    function withdrawFunds(address payable _to) public payable onlyOwner
    {
        _to.transfer(address(this).balance);
    }

    // Function to pause the contract
    // Requirements:
    // msg.sender is the owner
    function setPaused(bool _paused) public onlyOwner
    {
        paused = _paused;
    }

    // Function to destroy the contract and send funds to a specific address
    // Requirements:
    // msg.sender is the owner
    function destroyContract(address payable _to) public onlyOwner
    {
        selfdestruct(_to);
    }

    // Function to register the buyer
    // Requirements:
    // Contract is not paused
    function registerBuyer(string memory _name, string memory _email, string memory
    _shipAddress) public pausable
    {
        require(msg.sender!=owner,"The owner cannot register as a buyer.");
        Buyer storage newBuyer = buyers[msg.sender];
        newBuyer.name = _name;
        newBuyer.email = _email;
        newBuyer.shipAddress = _shipAddress;
        numBuyers++;

        emit NewBuyer(_name, _email, _shipAddress);
    }

    // Function to list all registered items
    function listItems () view public returns (uint[] memory)
    {
        return itemsList;
    }

    // Function to buy an item
    // Requirements:
    // msg.sender is registered as a buyer
    // Contract is not paused
    function BuyItem(uint _itemID, uint _quantity) public payable pausable
    {
        require(msg.sender!=owner,"The owner cannot buy items.");

        // Checks if the item is available in the inventory
        if (items[_itemID].inventory <= 0) {
            revert("This item is not available in the inventory.");
        }

        // Checks if the buyer is registered
        bytes memory tempName = bytes(buyers[msg.sender].name);
        if (tempName.length == 0) {
            revert("This address is not registered.");
        }

            uint amount = items[_itemID].price * _quantity;

            // Checks if the wei sent is more than needed
            // If yes, refund the extra wei
            if (msg.value > amount) {
                    msg.sender.transfer(msg.value - amount);
            }

            //Checks if the wei sent is less than needed
            if (msg.value < amount) {
                revert("The amount sent is not enough.");
            }

            Order storage newOrder = orders[numOrders+1];
            newOrder.orderID = numOrders+1;
            newOrder.email = buyers[msg.sender].email;
            newOrder.shipAddress = buyers[msg.sender].shipAddress;
            ordersList.push(numOrders+1);
            numOrders++;

            items[_itemID].inventory = items[_itemID].inventory - _quantity;
            emit NewOrder(numOrders, _itemID, _quantity, msg.sender);
    }

    // Fallback function
    fallback () external {}

}
