Vue.component(VueQrcode.name, VueQrcode)

const mapCards = obj => {
  obj.date = Quasar.utils.date.formatDate(
    new Date(obj.time * 1000),
    'YYYY-MM-DD HH:mm'
  )

  return obj
}

new Vue({
  el: '#vue',
  mixins: [windowMixin],
  data: function () {
    return {
      cards: [],
      hits: [],
      withdrawsOptions: [],
      cardDialog: {
        show: false,
        data: {},
        temp: {}
      },
      cardsTable: {
        columns: [
          {
            name: 'id',
            align: 'left',
            label: 'ID',
            field: 'id'
          },
          {
            name: 'card_name',
            align: 'left',
            label: 'Card name',
            field: 'card_name'
          },
          {
            name: 'counter',
            align: 'left',
            label: 'Counter',
            field: 'counter'
          },
          {
            name: 'withdraw',
            align: 'left',
            label: 'Withdraw ID',
            field: 'withdraw'
          }
        ],
        pagination: {
          rowsPerPage: 10
        }
      },
      hitsTable: {
        columns: [
          {
            name: 'card_name',
            align: 'left',
            label: 'Card name',
            field: 'card_name'
          },
          {
            name: 'old_ctr',
            align: 'left',
            label: 'Old counter',
            field: 'old_ctr'
          },
          {
            name: 'new_ctr',
            align: 'left',
            label: 'New counter',
            field: 'new_ctr'
          },
          {
            name: 'date',
            align: 'left',
            label: 'Time',
            field: 'date'
          },
          {
            name: 'ip',
            align: 'left',
            label: 'IP',
            field: 'ip'
          },
          {
            name: 'useragent',
            align: 'left',
            label: 'User agent',
            field: 'useragent'
          }
        ],
        pagination: {
          rowsPerPage: 10,
          sortBy: 'date',
          descending: true
        }
      },
      qrCodeDialog: {
        show: false,
        data: null
      }
    }
  },
  methods: {
    getCards: function () {
      var self = this

      LNbits.api
        .request(
          'GET',
          '/boltcards/api/v1/cards?all_wallets=true',
          this.g.user.wallets[0].inkey
        )
        .then(function (response) {
          self.cards = response.data.map(function (obj) {
            return mapCards(obj)
          })
          console.log(self.cards)
        })
    },
    getHits: function () {
      var self = this

      LNbits.api
        .request(
          'GET',
          '/boltcards/api/v1/hits?all_wallets=true',
          this.g.user.wallets[0].inkey
        )
        .then(function (response) {
          self.hits = response.data.map(function (obj) {
            obj.card_name = self.cards.find(d => d.id == obj.card_id).card_name
            return mapCards(obj)
          })
          console.log(self.hits)
        })
    },
    getWithdraws: function () {
      var self = this

      LNbits.api
        .request(
          'GET',
          '/withdraw/api/v1/links?all_wallets=true',
          this.g.user.wallets[0].inkey
        )
        .then(function (response) {
          self.withdrawsOptions = response.data.map(function (obj) {
            return {
              label: [obj.title, ' - ', obj.id].join(''),
              value: obj.id
            }
          })
          console.log(self.withdraws)
        })
    },
    openQrCodeDialog(cardId) {
      var card = _.findWhere(this.cards, {id: cardId})

      this.qrCodeDialog.data = {
        link: window.location.origin + '/boltcards/api/v1/auth?a=' + card.otp,
        id: card.id,
        name: card.card_name,
        uid: card.uid,
        k0: card.k0,
        k1: card.k1,
        k2: card.k2
      }
      this.qrCodeDialog.show = true
    },
    generateKeys: function () {
      const genRanHex = size =>
        [...Array(size)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('')

      debugcard =
        typeof this.cardDialog.data.card_name === 'string' &&
        this.cardDialog.data.card_name.search('debug') > -1

      this.cardDialog.data.k0 = debugcard
        ? '11111111111111111111111111111111'
        : genRanHex(32)
      this.$refs['k0'].value = this.cardDialog.data.k0

      this.cardDialog.data.k1 = debugcard
        ? '22222222222222222222222222222222'
        : genRanHex(32)
      this.$refs['k1'].value = this.cardDialog.data.k1

      this.cardDialog.data.k2 = debugcard
        ? '33333333333333333333333333333333'
        : genRanHex(32)
      this.$refs['k2'].value = this.cardDialog.data.k2
    },
    closeFormDialog: function () {
      this.cardDialog.data = {}
    },
    sendFormData: function () {
      let wallet = _.findWhere(this.g.user.wallets, {
        id: this.cardDialog.data.wallet
      })
      let data = this.cardDialog.data
      if (data.id) {
        this.updateCard(wallet, data)
      } else {
        this.createCard(wallet, data)
      }
    },
    createCard: function (wallet, data) {
      var self = this

      LNbits.api
        .request('POST', '/boltcards/api/v1/cards', wallet.adminkey, data)
        .then(function (response) {
          self.cards.push(mapCards(response.data))
          self.cardDialog.show = false
          self.cardDialog.data = {}
        })
        .catch(function (error) {
          LNbits.utils.notifyApiError(error)
        })
    },
    updateCardDialog: function (formId) {
      var card = _.findWhere(this.cards, {id: formId})
      console.log(card.id)
      this.cardDialog.data = _.clone(card)

      this.cardDialog.temp.k0 = this.cardDialog.data.k0
      this.cardDialog.temp.k1 = this.cardDialog.data.k1
      this.cardDialog.temp.k2 = this.cardDialog.data.k2

      this.cardDialog.show = true
    },
    updateCard: function (wallet, data) {
      var self = this

      if (
        this.cardDialog.temp.k0 != data.k0 ||
        this.cardDialog.temp.k1 != data.k1 ||
        this.cardDialog.temp.k2 != data.k2
      ) {
        data.prev_k0 = this.cardDialog.temp.k0
        data.prev_k1 = this.cardDialog.temp.k1
        data.prev_k2 = this.cardDialog.temp.k2
      }

      console.log(data)

      LNbits.api
        .request(
          'PUT',
          '/boltcards/api/v1/cards/' + data.id,
          wallet.adminkey,
          data
        )
        .then(function (response) {
          self.cards = _.reject(self.cards, function (obj) {
            return obj.id == data.id
          })
          self.cards.push(mapCards(response.data))
          self.cardDialog.show = false
          self.cardDialog.data = {}
        })
        .catch(function (error) {
          LNbits.utils.notifyApiError(error)
        })
    },
    deleteCard: function (cardId) {
      let self = this
      let cards = _.findWhere(this.cards, {id: cardId})

      LNbits.utils
        .confirmDialog('Are you sure you want to delete this card')
        .onOk(function () {
          LNbits.api
            .request(
              'DELETE',
              '/boltcards/api/v1/cards/' + cardId,
              _.findWhere(self.g.user.wallets, {id: cards.wallet}).adminkey
            )
            .then(function (response) {
              self.cards = _.reject(self.cards, function (obj) {
                return obj.id == cardId
              })
            })
            .catch(function (error) {
              LNbits.utils.notifyApiError(error)
            })
        })
    },
    exportCardsCSV: function () {
      LNbits.utils.exportCSV(this.cardsTable.columns, this.cards)
    }
  },
  created: function () {
    if (this.g.user.wallets.length) {
      this.getCards()
      this.getHits()
      this.getWithdraws()
    }
  }
})