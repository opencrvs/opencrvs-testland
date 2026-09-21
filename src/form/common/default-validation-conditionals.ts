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
import { Conditional } from '../types/types'
import { Validator } from '../types/validators'

/**
 * Turns a string expression into a Conditional object
 * @param expression conditional expression
 * @param action conditional action. e.g. 'hide' |'hideInPreview'. Defaults to 'hide'
 */
export const expressionToConditional = (
  expression: string,
  action: string = 'hide'
): Conditional => ({
  action,
  expression: `${expression}`
})

export const isValidChildBirthDate = [
  {
    operation: 'isValidChildBirthDate'
  }
] satisfies Validator[]

export const detailsExistConditional: Conditional[] = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  }
]

export const motherNationalIDVerfication = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `values.motherNidVerification`
  }
]

export const fatherNationalIDVerfication = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `values.fatherNidVerification`
  }
]

export const mothersBirthDateConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'hide',
    expression:
      'values.exactDateOfBirthUnknown && !$form?.idReader?.birthDate && $form?.verified !== "verified" && $form?.verified !== "authenticated"'
  },
  {
    action: 'disable',
    expression: `draftData?.mother?.fieldsModifiedByNidUserInfo?.includes('motherBirthDate')`
  }
]

export const parentsBirthDateValidators = [
  {
    operation: 'dateFormatIsCorrect',
    parameters: []
  },
  {
    operation: 'dateInPast',
    parameters: []
  },
  {
    operation: 'isValidParentsBirthDate',
    parameters: [5]
  }
] satisfies Validator[]

export const detailsExist = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  }
]

// if informant is not mother or father
export const informantNotMotherOrFather =
  '((values.informantType==="MOTHER") || (values.informantType==="FATHER") || (!values.informantType))'

export const hideIfInformantMotherOrFather = [
  {
    action: 'hide',
    expression: informantNotMotherOrFather
  }
]

export const isInformantSpouse =
  '!values.informantType || values.informantType==="SPOUSE"'

export const hideIfDeceasedAddressNotAvailable = [
  {
    action: 'hide',
    expression: '!(draftData && draftData.deceased?.countryPrimaryDeceased)'
  }
]

export const hideIfMotherAddressNotAvailable = [
  {
    action: 'hide',
    expression: '!(draftData && draftData.mother?.countryPrimaryMother)'
  }
]

export const hideIfInformantSpouse = [
  {
    action: 'hide',
    expression: isInformantSpouse
  }
]

export const mothersDetailsExistConditionals = [
  {
    action: 'hide',
    expression: 'draftData?.informant?.informantType==="MOTHER"'
  },
  {
    action: 'hideInPreview',
    expression: 'values.detailsExist'
  }
]

export const spouseDetailsExistConditionals = [
  {
    action: 'hide',
    expression: 'draftData?.informant?.informantType==="SPOUSE"'
  },
  {
    action: 'hideInPreview',
    expression: 'values.detailsExist'
  }
]

export const fathersDetailsExistConditionals = [
  {
    action: 'hide',
    expression: 'draftData?.informant?.informantType==="FATHER"'
  },
  {
    action: 'hideInPreview',
    expression: 'values.detailsExist'
  }
]

export const fathersBirthDateConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'hide',
    expression:
      'values.exactDateOfBirthUnknown && !$form?.idReader?.birthDate && $form?.verified !== "verified" && $form?.verified !== "authenticated"'
  },
  {
    action: 'disable',
    expression: `draftData?.father?.fieldsModifiedByNidUserInfo?.includes('fatherBirthDate')`
  }
]
export const motherFirstNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.mother?.fieldsModifiedByNidUserInfo?.includes('firstNamesEng')`
  }
]

export const motherFamilyNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.mother?.fieldsModifiedByNidUserInfo?.includes('familyNameEng')`
  }
]
export const fatherFirstNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.father?.fieldsModifiedByNidUserInfo?.includes('firstNamesEng')`
  }
]

export const fatherFamilyNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.father?.fieldsModifiedByNidUserInfo?.includes('familyNameEng')`
  }
]

export const hideIfInformantBrideOrGroom: Conditional[] = [
  {
    action: 'hide',
    expression:
      '(!values.informantType || values.informantType === "BRIDE" || values.informantType === "GROOM")'
  }
]

export const getInformantConditionalForMarriageDocUpload: Conditional[] = [
  {
    action: 'hide',
    expression:
      "(draftData && draftData.informant && draftData.informant.informantType && (draftData.informant.informantType === 'BRIDE' || draftData.informant.informantType === 'GROOM' ))"
  }
]

export const brideOrGroomBirthDateValidators = (spouseType: string) => [
  {
    operation: 'dateFormatIsCorrect',
    parameters: []
  },
  {
    operation: 'dateInPast',
    parameters: []
  },
  {
    operation: 'isValidDateOfBirthForMarriage',
    parameters: [spouseType, 18]
  }
]

export const brideOrGroomAgeValidators = [
  {
    operation: 'range',
    parameters: [18, 120]
  },
  {
    operation: 'maxLength',
    parameters: [3]
  }
] satisfies Validator[]

export const ageOfIndividualValidators: Validator[] = [
  {
    operation: 'range',
    parameters: [12, 120]
  },
  {
    operation: 'maxLength',
    parameters: [3]
  }
]

export const ageOfParentsConditionals = [
  ...ageOfIndividualValidators,
  {
    operation: 'isValidParentsBirthDate',
    parameters: [10, true]
  }
] satisfies Validator[]

export const ageOfDeceasedConditionals = [
  {
    operation: 'range',
    parameters: [0, 120]
  },
  {
    operation: 'maxLength',
    parameters: [3]
  }
] satisfies Validator[]

export const exactDateOfBirthUnknownConditional = [
  {
    action: 'hide',
    expression: '!values.exactDateOfBirthUnknown'
  }
]

export const isValidBirthDate = [
  {
    operation: 'isValidBirthDate'
  }
] satisfies Validator[]

export function getNationalIDValidators(configCase: string): Validator[] {
  if (configCase === 'father') {
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['mother.motherNationalId']
      }
    ]
  } else if (configCase === 'mother') {
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['father.fatherNationalId']
      }
    ]
  } else if (configCase === 'deceased') {
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['informant.informantNationalId']
      }
    ]
  } else if (configCase === 'groom') {
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['bride.brideNationalId']
      }
    ]
  } else if (configCase === 'bride') {
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['groom.groomNationalId']
      }
    ]
  } else {
    // informant id
    return [
      {
        operation: 'validIDNumber',
        parameters: ['NATIONAL_ID']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['deceased.deceasedNationalId']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['mother.motherNationalId']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['father.fatherNationalId']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['groom.groomNationalId']
      },
      {
        operation: 'duplicateIDNumber',
        parameters: ['bride.brideNationalId']
      }
    ]
  }
}

export const informantBirthDateConditionals = [
  {
    action: 'hide',
    expression:
      'values.exactDateOfBirthUnknown && !$form?.idReader?.birthDate && $form?.verified !== "verified" && $form?.verified !== "authenticated"'
  },
  {
    action: 'disable',
    expression: `draftData?.informant?.fieldsModifiedByNidUserInfo?.includes('informantBirthDate')`
  }
]

export const spouseBirthDateConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'hide',
    expression:
      'values.exactDateOfBirthUnknown && !$form?.idReader?.birthDate && $form?.verified !== "verified" && $form?.verified !== "authenticated"'
  },
  {
    action: 'disable',
    expression: `draftData?.spouse?.fieldsModifiedByNidUserInfo?.includes('spouseBirthDate')`
  }
]

export const informantFirstNameConditionals = [
  {
    action: 'disable',
    expression: `draftData?.informant?.fieldsModifiedByNidUserInfo?.includes('firstNamesEng')`
  }
]

export const informantFamilyNameConditionals = [
  {
    action: 'disable',
    expression: `draftData?.informant?.fieldsModifiedByNidUserInfo?.includes('familyNameEng')`
  }
]

export const spouseFirstNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.spouse?.fieldsModifiedByNidUserInfo?.includes('firstNamesEng')`
  }
]

export const spouseFamilyNameConditionals = [
  {
    action: 'hide',
    expression: '!values.detailsExist'
  },
  {
    action: 'disable',
    expression: `draftData?.spouse?.fieldsModifiedByNidUserInfo?.includes('familyNameEng')`
  }
]

// if mothers details do not exist on other page
export const mothersDetailsDontExistOnOtherPage =
  'draftData && draftData.mother && !draftData.mother.detailsExist'

// if details don't exist for the current section
export const detailsDontExist = '!values.detailsExist'

// primary address same as other primary
export const primaryAddressSameAsOtherPrimaryAddress =
  'values.primaryAddressSameAsOtherPrimary'
export const disableIfVerifiedOrAuthenticated = [
  {
    action: 'disable',
    expression:
      '$form?.verified === "verified" || $form?.verified === "authenticated"'
  }
]

export const hideIfQRReaderFilledBirthDate = [
  {
    action: 'hide',
    expression: '$form?.idReader?.birthDate'
  }
]

const disableIfVerified = [
  {
    action: 'disable',
    expression: '$form?.verified === "verified"'
  }
]

export const hideIfVerified = [
  { action: 'hide', expression: '$form?.verified === "verified"' }
]

const hideIfAuthenticated = [
  { action: 'hide', expression: '$form?.verified === "authenticated"' }
]

export const typeOfIDVerificationConditionals = [
  ...disableIfVerified,
  ...hideIfAuthenticated
]

export const exactDateOfBirthUnknownConditionals = [
  ...hideIfQRReaderFilledBirthDate,
  ...hideIfAuthenticated,
  ...hideIfVerified
]
