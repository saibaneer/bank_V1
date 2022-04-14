//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";

contract Bank {

    event Deposit(address indexed sender, uint amount, uint timeOfDeposit);
    
    // uint contractBalance = 0;
    address owner;
    uint startingBalance;

    mapping(address => uint) public balances;
    mapping(address => uint) public depositTime;

    constructor() payable{
        owner = msg.sender;
        startingBalance = msg.value;
    }



    function getContractBalance() public view returns(uint256) {
        require(msg.sender == owner, "You are not authorized to use this function.");
        return address(this).balance;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
        depositTime[msg.sender] = block.timestamp;
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function getUserBalance(address userAddress) public view returns(uint) {
        uint principal = balances[userAddress];
        uint timeElapsed = block.timestamp - depositTime[userAddress]; //seconds
        uint val = principal + uint((principal * 7 * timeElapsed) / (100 * 365 * 24 * 60 * 60)) + 1; //simple interest of 0.07%  per year
        return val;
    }    

    function withdraw() public payable {
        require(balances[msg.sender] > 0, "You need to fund your wallet");
        require(block.timestamp - depositTime[msg.sender]  > 86400, "You need to wait at least 1 day before withdrawing!");
        console.log("Amount deposited was: ", balances[msg.sender]);
        uint amountToWithdraw = getUserBalance(msg.sender);
        console.log("Amount due for withdrawal is: ", amountToWithdraw);
        payable(msg.sender).transfer(amountToWithdraw);
        balances[msg.sender] = 0;
        amountToWithdraw = 0;
    }

}