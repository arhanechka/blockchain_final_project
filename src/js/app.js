App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    $.getJSON('../horse.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
      // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
          App.web3Provider = web3.currentProvider;
      } else {
          // If no injected web3 instance is detected, fallback to the TestRPC
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      }
      web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
      $.getJSON('Hippodrome.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var AdoptionArtifact = data;
          App.contracts.Hippodrome = TruffleContract(AdoptionArtifact);

          // Set the provider for our contract
          App.contracts.Hippodrome.setProvider(App.web3Provider);

          // Use our contract to retrieve and mark the adopted pets
          return App.markAdopted();
      });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function(players, account) {
      var adoptionInstance;

      App.contracts.Hippodrome.deployed().then(function(instance) {
          adoptionInstance = instance;

          return adoptionInstance.getPlayers.call();
      }).then(function(players) {
          for (i = 0; i < players.length; i++) {
              if (players[i] !== '0x0000000000000000000000000000000000000000') {
                  $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
              }
          }
      }).catch(function(err) {
          console.log(err.message);
      });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var horseNumber = parseInt($(event.target).data('id'));

      var adoptionInstance;

      web3.eth.getAccounts(function(error, accounts) {
          if (error) {
              console.log(error);
          }

          var account = accounts[0];

          App.contracts.Hippodrome.deployed().then(function(instance) {
              adoptionInstance = instance;

              // Execute adopt as a transaction by sending account
              return adoptionInstance.bet(horseNumber, {from: account});

          }).then(function(result) {

              return App.markAdopted();
          }).catch(function(err) {
              console.log(err.message);
          });
      });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
