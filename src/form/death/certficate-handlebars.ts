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
  eventDate: 'eventDate',
  deceasedFirstName: 'deceasedFirstName',
  deceasedFamilyName: 'deceasedFamilyName',
  deceasedGender: 'deceasedGender',
  deceasedBirthDate: 'deceasedBirthDate',
  deceasedNationality: 'deceasedNationality',
  deceasedNationalId: 'deceasedNationalId',
  deceasedPassport: 'deceasedPassport',
  deceasedAlienId: 'deceasedAlienId',
  deceasedRefugeeId: 'deceasedRefugeeId',
  deceasedMaritalStatus: 'deceasedMaritalStatus',
  countryPrimaryDeceased: 'countryPrimaryDeceased',
  statePrimaryDeceased: 'statePrimaryDeceased',
  districtPrimaryDeceased: 'districtPrimaryDeceased',
  cityPrimaryDeceased: 'cityPrimaryDeceased',
  ageOfDeceasedInYears: 'ageOfDeceasedInYears',
  addressLine3UrbanOptionPrimaryDeceased:
    'addressLine3UrbanOptionPrimaryDeceased',
  addressLine2UrbanOptionPrimaryDeceased:
    'addressLine2UrbanOptionPrimaryDeceased',
  addressLine1UrbanOptionPrimaryDeceased:
    'addressLine1UrbanOptionPrimaryDeceased',
  ageOfInformantInYears: 'ageOfInformantInYears',
  ageOfSpouseInYears: 'ageOfSpouseInYears',
  addressLine3PrimaryDeceased: 'addressLine3PrimaryDeceased',
  addressLine2PrimaryDeceased: 'addressLine2PrimaryDeceased',
  addressLine1PrimaryDeceased: 'addressLine1PrimaryDeceased',
  postalCodePrimaryDeceased: 'postalCodePrimaryDeceased',
  addressLine1RuralOptionPrimaryDeceased:
    'addressLine1RuralOptionPrimaryDeceased',
  internationalStatePrimaryDeceased: 'internationalStatePrimaryDeceased',
  internationalDistrictPrimaryDeceased: 'internationalDistrictPrimaryDeceased',
  internationalCityPrimaryDeceased: 'internationalCityPrimaryDeceased',
  internationalAddressLine1PrimaryDeceased:
    'internationalAddressLine1PrimaryDeceased',
  internationalAddressLine2PrimaryDeceased:
    'internationalAddressLine2PrimaryDeceased',
  internationalAddressLine3PrimaryDeceased:
    'internationalAddressLine3PrimaryDeceased',
  internationalPostalCodePrimaryDeceased:
    'internationalPostalCodePrimaryDeceased',
  mannerOfDeath: 'mannerOfDeath',
  causeOfDeathEstablished: 'causeOfDeathEstablished',
  causeOfDeathMethod: 'causeOfDeathMethod',
  deathDescription: 'deathDescription',
  placeOfDeath: 'placeOfDeath', // equal to either the name of a HEALTH_FACILITY or undefined
  placeOfDeathCountry: 'placeOfDeathCountry', // used where event occurs in a HEALTH_FACILITY
  placeOfDeathDistrict: 'placeOfDeathDistrict', // used where event occurs in a HEALTH_FACILITY
  placeOfDeathFacility: 'placeOfDeathFacility', // used where event occurs in a HEALTH_FACILITY
  placeOfDeathState: 'placeOfDeathState', // used where event occurs in a HEALTH_FACILITY
  countryPlaceofdeath: 'countryPlaceofdeath', // THE FOLLOWING are used where event occurs in a PRIVATE_HOME or OTHER therefore placeOfBirth is undefined
  statePlaceofdeath: 'statePlaceofdeath', // @deprecated use statePlaceofdeathId instead
  statePlaceofdeathId: 'statePlaceofdeathId',
  districtPlaceofdeath: 'districtPlaceofdeath', // @deprecated use districtPlaceofdeathId instead
  districtPlaceofdeathId: 'districtPlaceofdeathId',
  cityPlaceofdeath: 'cityPlaceofdeath',
  addressLine3UrbanOptionPlaceofdeath: 'addressLine3UrbanOptionPlaceofdeath',
  addressLine2UrbanOptionPlaceofdeath: 'addressLine2UrbanOptionPlaceofdeath',
  addressLine1UrbanOptionPlaceofdeath: 'addressLine1UrbanOptionPlaceofdeath',
  postalCodePlaceofdeath: 'postalCodePlaceofdeath',
  addressLine1RuralOptionPlaceofdeath: 'addressLine1RuralOptionPlaceofdeath',
  internationalStatePlaceofdeath: 'internationalStatePlaceofdeath',
  internationalDistrictPlaceofdeath: 'internationalDistrictPlaceofdeath',
  internationalCityPlaceofdeath: 'internationalCityPlaceofdeath',
  internationalAddressLine1Placeofdeath:
    'internationalAddressLine1Placeofdeath',
  internationalAddressLine2Placeofdeath:
    'internationalAddressLine2Placeofdeath',
  internationalAddressLine3Placeofdeath:
    'internationalAddressLine3Placeofdeath',
  internationalPostalCodePlaceofdeath: 'internationalPostalCodePlaceofdeath',
  informantType: 'informantType',
  informantFirstName: 'informantFirstName',
  informantFamilyName: 'informantFamilyName',
  informantBirthDate: 'informantBirthDate',
  informantNationality: 'informantNationality',
  informantNationalId: 'informantNationalId',
  informantPassport: 'informantPassport',
  informantAlienId: 'informantAlienId',
  informantRefugeeId: 'informantRefugeeId',
  countryPrimaryInformant: 'countryPrimaryInformant',
  statePrimaryInformant: 'statePrimaryInformant',
  districtPrimaryInformant: 'districtPrimaryInformant',
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
  spouseFirstName: 'spouseFirstName',
  spouseFamilyName: 'spouseFamilyName',
  spouseReasonNotApplying: 'spouseReasonNotApplying',
  spouseBirthDate: 'spouseBirthDate',
  spouseNationality: 'spouseNationality',
  spouseNationalId: 'spouseNationalId',
  spousePassport: 'spousePassport',
  spouseAlienId: 'spouseAlienId',
  spouseRefugeeId: 'spouseRefugeeId',
  spouseOccupation: 'spouseOccupation',
  spouseEducationalAttainment: 'spouseEducationalAttainment',
  countryPrimarySpouse: 'countryPrimarySpouse',
  statePrimarySpouse: 'statePrimarySpouse',
  districtPrimarySpouse: 'districtPrimarySpouse',
  cityPrimarySpouse: 'cityPrimarySpouse',
  addressLine3UrbanOptionPrimarySpouse: 'addressLine3UrbanOptionPrimarySpouse',
  addressLine2UrbanOptionPrimarySpouse: 'addressLine2UrbanOptionPrimarySpouse',
  addressLine1UrbanOptionPrimarySpouse: 'addressLine1UrbanOptionPrimarySpouse',
  postalCodePrimarySpouse: 'postalCodePrimarySpouse',
  addressLine1RuralOptionPrimarySpouse: 'addressLine1RuralOptionPrimarySpouse',
  internationalStatePrimarySpouse: 'internationalStatePrimarySpouse',
  internationalDistrictPrimarySpouse: 'internationalDistrictPrimarySpouse',
  internationalCityPrimarySpouse: 'internationalCityPrimarySpouse',
  internationalAddressLine1PrimarySpouse:
    'internationalAddressLine1PrimarySpouse',
  internationalAddressLine2PrimarySpouse:
    'internationalAddressLine2PrimarySpouse',
  internationalAddressLine3PrimarySpouse:
    'internationalAddressLine3PrimarySpouse',
  internationalPostalCodePrimarySpouse: 'internationalPostalCodePrimarySpouse',
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
  countryPrimaryMother: 'countryPrimaryMother',
  statePrimaryMother: 'statePrimaryMother',
  districtPrimaryMother: 'districtPrimaryMother',
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
  statePrimaryFather: 'statePrimaryFather',
  districtPrimaryFather: 'districtPrimaryFather',
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
