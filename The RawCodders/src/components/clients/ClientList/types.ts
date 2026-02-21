export type TAddress = {
    city: string
    country: string
    line1: string
    line2: string
    postCode: string
}

export type TClient = {
  _id: string
  address: TAddress
  birthDate: string
  name: string
  phone: string
  email: string
  sex: string
}
