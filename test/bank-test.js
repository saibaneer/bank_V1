const { assert } = require("chai");
const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("Bank Contract Function", function () {
  let owner;
  let bob;
  let charlie;
  let contract;
  let deposit = ethers.utils.parseEther("15");  


  beforeEach(async function(){
    [owner, bob, charlie] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank", owner);
    contract = await Bank.deploy({ value: deposit });
    await contract.deployed();
    
  })
  it("Should return the contract balance", async function () {
    
    const tx = await contract.connect(owner).getContractBalance();
    assert.equal(tx.toString(), ethers.utils.parseEther("15"))
  });
  it("Should not allow a non-owner call the contract balance", async function(){
    try {
      const tx = await contract.connect(bob).getContractBalance();
    } catch (error) {
      assert(
        error.message.includes("You are not authorized to use this function.")        
      );
      return;
    }
    assert(false);
  })

  it("Should allow for deposit", async function () {
    let bob_funds = ethers.utils.parseEther("2");
    await contract.connect(bob).deposit({ value: bob_funds });
    let bobs_balance = await contract.connect(bob).balances(bob.address);
    assert.equal(bobs_balance.toString(), ethers.utils.parseEther("2"));
  });

  it("Depositors must wait at least 1 day to be able to withdraw", async function () {
    try {
      let charlie_funds = ethers.utils.parseEther("2");
      await contract.connect(charlie).deposit({ value: charlie_funds });
      ethers.provider.send("evm_increaseTime", [86300]); // add 60 seconds
      ethers.provider.send("evm_mine"); // mine the next block; won't work unless you add this
      await contract.connect(charlie).withdraw();
    } catch (error) {
      //console.log(error)
      assert(
        error.message.includes(
          "You need to wait at least 1 day before withdrawing!"
        )
      );
      return;

    }
    assert(false);
  });

  describe("Test deposit related functions", function(){

    let old_balance;
    let depositorBalanceBefore;

    beforeEach(async function(){
      depositorBalanceBefore = await ethers.provider.getBalance(bob.address)
      let bob_funds = ethers.utils.parseEther("2");
      await contract.connect(bob).deposit({ value: bob_funds });
      old_balance = await contract.connect(bob).balances(bob.address);
      //console.log("Bob's old balance is: ", old_balance.toString());
      const oneYear = 365 * 24 * 60 * 60;

      ethers.provider.send("evm_increaseTime", [oneYear])   // add 60 seconds
      ethers.provider.send("evm_mine")      // mine the next block; won't work unless you add this
      
      
    })

    it("Balance after a year should be more than balance at deposit time", async function(){     

      let new_balance = await contract.connect(bob).getUserBalance(bob.address);
      assert(new_balance.gt(old_balance));
    })
    it("Withdrawal balance is greater than starting balance", async function(){
      await contract.connect(bob).withdraw();
      let new_balance = await ethers.provider.getBalance(bob.address);
      // console.log("Bob's new balance is: ", new_balance.toString());
      // console.log("Bob's old balance was: ", depositorBalanceBefore.toString());
      let diff = new_balance.sub(depositorBalanceBefore);
      console.log("Difference is: ", diff.toString());
      assert(diff.gt(0));
    })
    it("Non-depositors are not allowed to withdraw", async function(){
      try {
        await contract.connect(charlie).withdraw();
      } catch (error) {
        assert(error.message.includes("You need to fund your wallet"));
        return
      }
      assert(false);
    })
    
  })
  

});
