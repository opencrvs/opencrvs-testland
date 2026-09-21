/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */

// THE FOLLOWING HANDLEBARS CAN BE USED IN THE SVG CODE IN THE CERTIFICATE FOR THIS EVENT

export const certificateHandlebars = {
  registrationNumber: 'registrationNumber',
  qrCode: 'qrCode',
  certificateDate: 'certificateDate',
  registrar: 'registrar',
  registrationAgent: 'registrationAgent',
  registrarName: 'registrarName',
  role: 'role',
  registrarSignature: 'registrarSignature',
  registrationDate: 'registrationDate',
  registrationLocation: 'registrationLocation',
  contactEmail: 'contactEmail',
  contactPhoneNumber: 'contactPhoneNumber',
  birthConfigurableIdentifier1: 'birthConfigurableIdentifier1',
  birthConfigurableIdentifier2: 'birthConfigurableIdentifier2',
  birthConfigurableIdentifier3: 'birthConfigurableIdentifier3',
  placeOfBirth: 'placeOfBirth', // equal to the full place of birth
  placeOfBirthFacility: 'placeOfBirthFacility', // equal to either the name of a HEALTH_FACILITY or undefined
  countryPlaceofbirth: 'countryPlaceofbirth',
  statePlaceofbirth: 'statePlaceofbirth', // @deprecated use statePlaceofbirthId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  statePlaceofbirthId: 'statePlaceofbirthId', // Use with location helper like this: {{location statePlaceofbirthId 'name'}}
  districtPlaceofbirth: 'districtPlaceofbirth', // @deprecated use districtPlaceofbirthId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  districtPlaceofbirthId: 'districtPlaceofbirthId', // Use with location helper like this: {{location districtPlaceofbirthId 'name'}}
  cityPlaceofbirth: 'cityPlaceofbirth',
  addressLine3UrbanOptionPlaceofbirth: 'addressLine3UrbanOptionPlaceofbirth',
  addressLine2UrbanOptionPlaceofbirth: 'addressLine2UrbanOptionPlaceofbirth',
  addressLine1UrbanOptionPlaceofbirth: 'addressLine1UrbanOptionPlaceofbirth',
  postalCodePlaceofbirth: 'postalCodePlaceofbirth',
  addressLine1RuralOptionPlaceofbirth: 'addressLine1RuralOptionPlaceofbirth',
  internationalStatePlaceofbirth: 'internationalStatePlaceofbirth',
  internationalDistrictPlaceofbirth: 'internationalDistrictPlaceofbirth',
  internationalCityPlaceofbirth: 'internationalCityPlaceofbirth',
  internationalAddressLine1Placeofbirth:
    'internationalAddressLine1Placeofbirth',
  internationalAddressLine2Placeofbirth:
    'internationalAddressLine2Placeofbirth',
  internationalAddressLine3Placeofbirth:
    'internationalAddressLine3Placeofbirth',
  internationalPostalCodePlaceofbirth: 'internationalPostalCodePlaceofbirth',
  informantType: 'informantType',
  attendantAtBirth: 'attendantAtBirth',
  multipleBirth: 'multipleBirth',
  weightAtBirth: 'weightAtBirth',
  birthType: 'birthType',
  childFirstName: 'childFirstName',
  childMiddleName: 'childMiddleName',
  childFamilyName: 'childFamilyName',
  childGender: 'childGender',
  eventDate: 'eventDate',
  ageOfFatherInYears: 'ageOfFatherInYears',
  ageOfMotherInYears: 'ageOfMotherInYears',
  ageOfInformantInYears: 'ageOfInformantInYears',
  informantFirstName: 'informantFirstName',
  informantFamilyName: 'informantFamilyName',
  informantBirthDate: 'informantBirthDate',
  informantNationality: 'informantNationality',
  informantNationalId: 'informantNationalId',
  informantPassport: 'informantPassport',
  informantAlienId: 'informantAlienId',
  informantRefugeeId: 'informantRefugeeId',
  motherReasonNotApplying: 'motherReasonNotApplying',
  motherBirthDate: 'motherBirthDate',
  motherFirstName: 'motherFirstName',
  motherFamilyName: 'motherFamilyName',
  motherNationality: 'motherNationality',
  motherNationalId: 'motherNationalId',
  motherPassport: 'motherPassport',
  motherAlienId: 'motherAlienId',
  motherRefugeeId: 'motherRefugeeId',
  motherMaritalStatus: 'motherMaritalStatus',
  motherOccupation: 'motherOccupation',
  motherEducationalAttainment: 'motherEducationalAttainment',
  fatherBirthDate: 'fatherBirthDate',
  fatherFirstName: 'fatherFirstName',
  fatherFamilyName: 'fatherFamilyName',
  fatherNationality: 'fatherNationality',
  fatherNationalId: 'fatherNationalId',
  fatherPassport: 'fatherPassport',
  fatherAlienId: 'fatherAlienId',
  fatherRefugeeId: 'fatherRefugeeId',
  fatherMaritalStatus: 'fatherMaritalStatus',
  fatherOccupation: 'fatherOccupation',
  fatherEducationalAttainment: 'fatherEducationalAttainment',
  countryPrimaryInformant: 'countryPrimaryInformant',
  statePrimaryInformant: 'statePrimaryInformant', // @deprecated use statePrimaryInformantId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  statePrimaryInformantId: 'statePrimaryInformantId', // Use with location helper like this: {{location statePrimaryInformantId 'name'}}
  districtPrimaryInformant: 'districtPrimaryInformant', // @deprecated use districtPrimaryInformantId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  districtPrimaryInformantId: 'districtPrimaryInformantId', // Use with location helper like this: {{location districtPrimaryInformantId 'name'}}
  cityPrimaryInformant: 'cityPrimaryInformant',
  addressLine3UrbanOptionPrimaryInformant:
    'addressLine3UrbanOptionPrimaryInformant',
  addressLine2UrbanOptionPrimaryInformant:
    'addressLine2UrbanOptionPrimaryInformant',
  addressLine1UrbanOptionPrimaryInformant:
    'addressLine1UrbanOptionPrimaryInformant',
  postalCodePrimaryInformant: 'postalCodePrimaryInformant',
  addressLine1RuralOptionPrimaryInformant:
    'addressLine1RuralOptionPrimaryInformant',
  internationalStatePrimaryInformant: 'internationalStatePrimaryInformant',
  internationalDistrictPrimaryInformant:
    'internationalDistrictPrimaryInformant',
  internationalCityPrimaryInformant: 'internationalCityPrimaryInformant',
  internationalAddressLine1PrimaryInformant:
    'internationalAddressLine1PrimaryInformant',
  internationalAddressLine2PrimaryInformant:
    'internationalAddressLine2PrimaryInformant',
  internationalAddressLine3PrimaryInformant:
    'internationalAddressLine3PrimaryInformant',
  internationalPostalCodePrimaryInformant:
    'internationalPostalCodePrimaryInformant',
  countryPrimaryMother: 'countryPrimaryMother',
  statePrimaryMother: 'statePrimaryMother', // @deprecated use statePrimaryMotherId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  statePrimaryMotherId: 'statePrimaryMotherId', // Use with location helper like this: {{location statePrimaryMotherId 'name'}}
  districtPrimaryMother: 'districtPrimaryMother', // @deprecated use districtPrimaryMotherId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  districtPrimaryMotherId: 'districtPrimaryMotherId', // Use with location helper like this: {{location districtPrimaryMotherId 'name'}}
  cityPrimaryMother: 'cityPrimaryMother',
  addressLine3UrbanOptionPrimaryMother: 'addressLine3UrbanOptionPrimaryMother',
  addressLine2UrbanOptionPrimaryMother: 'addressLine2UrbanOptionPrimaryMother',
  addressLine1UrbanOptionPrimaryMother: 'addressLine1UrbanOptionPrimaryMother',
  postalCodePrimaryMother: 'postalCodePrimaryMother',
  addressLine1RuralOptionPrimaryMother: 'addressLine1RuralOptionPrimaryMother',
  internationalStatePrimaryMother: 'internationalStatePrimaryMother',
  internationalDistrictPrimaryMother: 'internationalDistrictPrimaryMother',
  internationalCityPrimaryMother: 'internationalCityPrimaryMother',
  internationalAddressLine1PrimaryMother:
    'internationalAddressLine1PrimaryMother',
  internationalAddressLine2PrimaryMother:
    'internationalAddressLine2PrimaryMother',
  internationalAddressLine3PrimaryMother:
    'internationalAddressLine3PrimaryMother',
  internationalPostalCodePrimaryMother: 'internationalPostalCodePrimaryMother',
  fatherReasonNotApplying: 'fatherReasonNotApplying',
  countryPrimaryFather: 'countryPrimaryFather',
  statePrimaryFather: 'statePrimaryFather', // @deprecated use statePrimaryFatherId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  statePrimaryFatherId: 'statePrimaryFatherId', // Use with location helper like this: {{location statePrimaryFatherId 'name'}}
  districtPrimaryFather: 'districtPrimaryFather', // @deprecated use districtPrimaryFatherId instead: Refer to https://github.com/opencrvs/opencrvs-farajaland/pull/815
  districtPrimaryFatherId: 'districtPrimaryFatherId', // Use with location helper like this: {{location districtPrimaryFatherId 'name'}}
  cityPrimaryFather: 'cityPrimaryFather',
  addressLine3UrbanOptionPrimaryFather: 'addressLine3UrbanOptionPrimaryFather',
  addressLine2UrbanOptionPrimaryFather: 'addressLine2UrbanOptionPrimaryFather',
  addressLine1UrbanOptionPrimaryFather: 'addressLine1UrbanOptionPrimaryFather',
  postalCodePrimaryFather: 'postalCodePrimaryFather',
  addressLine1RuralOptionPrimaryFather: 'addressLine1RuralOptionPrimaryFather',
  internationalStatePrimaryFather: 'internationalStatePrimaryFather',
  internationalDistrictPrimaryFather: 'internationalDistrictPrimaryFather',
  internationalCityPrimaryFather: 'internationalCityPrimaryFather',
  internationalAddressLine1PrimaryFather:
    'internationalAddressLine1PrimaryFather',
  internationalAddressLine2PrimaryFather:
    'internationalAddressLine2PrimaryFather',
  internationalAddressLine3PrimaryFather:
    'internationalAddressLine3PrimaryFather',
  internationalPostalCodePrimaryFather: 'internationalPostalCodePrimaryFather'
}
