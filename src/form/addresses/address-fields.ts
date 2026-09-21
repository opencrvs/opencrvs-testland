import { MessageDescriptor } from 'react-intl'
import {
  AddressCases,
  AddressCopyConfigCases,
  AddressSubsections,
  Conditional,
  EventLocationAddressCases,
  FLEX_DIRECTION,
  SerializedFormField
} from '../types/types'
import {
  getAddressConditionals,
  getDependency,
  getMapping,
  getPlaceOfEventConditionals,
  isUseCaseForPlaceOfEvent,
  sentenceCase
} from '../../utils/address-utils'
import {
  urbanRuralRadioOptions,
  yesNoRadioOptions
} from '../common/select-options'
import { ADMIN_LEVELS } from '.'
import { getPlaceOfBirthFields } from '../birth/required-fields'
import { getPlaceOfDeathFields } from '../death/required-fields'
import { expressionToConditional } from '../common/default-validation-conditionals'

// A radio group field that allows you to select an address from another section
export const getXAddressSameAsY = (
  xComparisonSection: string,
  yComparisonSection: string,
  label: MessageDescriptor,
  conditionals?: Conditional[] | string
): SerializedFormField[] => {
  const copyAddressField: SerializedFormField = {
    name: AddressCopyConfigCases.PRIMARY_ADDRESS_SAME_AS_OTHER_PRIMARY,
    type: 'RADIO_GROUP',
    label,
    required: true,
    initialValue: true,
    validator: [],
    options: yesNoRadioOptions,
    conditionals: conditionals
      ? typeof conditionals === 'string'
        ? [expressionToConditional(conditionals)]
        : conditionals
      : [],
    mapping: {
      mutation: {
        operation: 'copyAddressTransformer',
        parameters: [
          AddressCases.PRIMARY_ADDRESS,
          yComparisonSection,
          AddressCases.PRIMARY_ADDRESS,
          xComparisonSection
        ]
      },
      query: {
        operation: 'sameAddressFieldTransformer',
        parameters: [
          AddressCases.PRIMARY_ADDRESS,
          yComparisonSection,
          AddressCases.PRIMARY_ADDRESS,
          xComparisonSection
        ]
      }
    }
  }
  return [copyAddressField]
}

// A select field that uses the loaded administrative location levels from Humdata
// We recommend that you do not edit this function
export function getAddressLocationSelect({
  section,
  location,
  useCase,
  fhirLineArrayPosition,
  isLowestAdministrativeLevel,
  initialValue
}: {
  section: string
  location: string
  useCase: string
  initialValue: string
  /** Position where the location gets mapped into within a fhir.Address line-array */
  fhirLineArrayPosition?: number
  /** If the structure the smallest possible level. Allows saving fhir.Address.partOf */
  isLowestAdministrativeLevel?: boolean
}): SerializedFormField {
  const fieldName = `${location}${sentenceCase(useCase)}${sentenceCase(
    section
  )}`
  return {
    name: fieldName,
    type: 'SELECT_WITH_DYNAMIC_OPTIONS',
    label: {
      defaultMessage: sentenceCase(location),
      description: `Title for the ${location} select`,
      id: `form.field.label.${location}`
    },
    previewGroup: isUseCaseForPlaceOfEvent(useCase)
      ? useCase
      : `${useCase}Address`,
    required: true,
    initialValue,
    validator: [],
    placeholder: {
      defaultMessage: 'Select',
      description: 'Placeholder text for a select',
      id: 'form.field.select.placeholder'
    },
    dynamicOptions: {
      resource: 'locations',
      dependency: getDependency(location, useCase, section)
    },
    conditionals: isUseCaseForPlaceOfEvent(useCase)
      ? getPlaceOfEventConditionals(
          section,
          location,
          useCase as EventLocationAddressCases
        )
      : getAddressConditionals(section, location, useCase),
    mapping: getMapping({
      section,
      type: 'SELECT_WITH_DYNAMIC_OPTIONS',
      location,
      useCase,
      fieldName,
      fhirLineArrayPosition,
      isLowestAdministrativeLevel
    })
  }
}

// Select fields are added for each administrative location level from Humdata
// We recommend that you do not edit this function
function getAdminLevelSelects(
  section: string,
  useCase: string,
  addressHierarchy: string[]
): SerializedFormField[] {
  switch (ADMIN_LEVELS) {
    case 1:
      return [
        getAddressLocationSelect({
          section,
          location: 'state',
          useCase,
          isLowestAdministrativeLevel: true,
          initialValue: addressHierarchy[0]
        })
      ]
    case 2:
      return [
        getAddressLocationSelect({
          section,
          location: 'state',
          useCase,
          initialValue: addressHierarchy[0]
        }),
        getAddressLocationSelect({
          section,
          location: 'district',
          useCase,
          isLowestAdministrativeLevel: true,
          initialValue: addressHierarchy[1]
        })
      ]
    case 3:
      return [
        getAddressLocationSelect({
          section,
          location: 'state',
          useCase,
          initialValue: addressHierarchy[0]
        }),
        getAddressLocationSelect({
          section,
          location: 'district',
          useCase,
          initialValue: addressHierarchy[1]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel3',
          useCase,
          fhirLineArrayPosition: 10,
          isLowestAdministrativeLevel: true,
          initialValue: addressHierarchy[2]
        })
      ]
    case 4:
      return [
        getAddressLocationSelect({
          section,
          location: 'state',
          useCase,
          initialValue: addressHierarchy[0]
        }),
        getAddressLocationSelect({
          section,
          location: 'district',
          useCase,
          initialValue: addressHierarchy[1]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel3',
          useCase,
          fhirLineArrayPosition: 10,
          initialValue: addressHierarchy[2]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel4',
          useCase,
          fhirLineArrayPosition: 11,
          isLowestAdministrativeLevel: true,
          initialValue: addressHierarchy[3]
        })
      ]
    case 5:
      return [
        getAddressLocationSelect({
          section,
          location: 'state',
          useCase,
          initialValue: addressHierarchy[0]
        }),
        getAddressLocationSelect({
          section,
          location: 'district',
          useCase,
          initialValue: addressHierarchy[1]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel3',
          useCase,
          fhirLineArrayPosition: 10,
          initialValue: addressHierarchy[2]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel4',
          useCase,
          fhirLineArrayPosition: 11,
          initialValue: addressHierarchy[3]
        }),
        getAddressLocationSelect({
          section,
          location: 'locationLevel5',
          useCase,
          fhirLineArrayPosition: 12,
          isLowestAdministrativeLevel: true,
          initialValue: addressHierarchy[4]
        })
      ]
  }
}

// Place of birth and death fields require a select option to choose a hospital from health facility databases
// We recommend that you do not edit this function
function getPlaceOfEventFields(useCase: EventLocationAddressCases) {
  switch (useCase) {
    case EventLocationAddressCases.PLACE_OF_BIRTH:
      return [...getPlaceOfBirthFields()]
    case EventLocationAddressCases.PLACE_OF_DEATH:
      return [...getPlaceOfDeathFields()]
    case EventLocationAddressCases.PLACE_OF_MARRIAGE:
      return []
    default:
      return []
  }
}

// The fields that appear whenever an address is rendered

// ====================== WARNING REGARDING ADDRESS CONFIGURATION ======================

// WE HAVE SPENT CONSIDERABLE TIME WORKING IN COLLABORATION WITH INTERNATIONAL STANDARDS COMMITTEES ON INTEROPERABLE ADDRESS FORMAT.
// WE STRONGLY BELIEVE THAT OUR ADDRESS STRUCTURE IS BEST OPTIMISED FOR EVERY POSSIBLE ADDRESS, ANYWHERE IN THE WORLD. (URBAN OR RURAL - STANDARDISED OR UNSTANDARDISED)
// OUR APPROACH TO ADDRESS FORMAT INTEROPERATES WITH OTHER DIGITAL PUBLIC GOODS USING FHIR & OPENID
// OUR RECOMENDATION IS THAT YOU ADOPT THESE ADDRESS FIELDS, OTHERWISE YOU MAY LOSE VALUABLE ANALYTICAL AND INTEROPERABLE FUNCTIONALITY
// WE MARK REQUIRED AND OPTIONAL FIELDS BELOW ACCORDINGLY

// ==================================== END WARNING ====================================
export function getAddressFields(
  section: string,
  addressCase: EventLocationAddressCases | AddressCases,
  addressHierarchy: string[]
): SerializedFormField[] {
  let useCase = addressCase as string
  let placeOfEventFields: SerializedFormField[] = []
  if (addressCase in AddressCases) {
    useCase = useCase === AddressCases.PRIMARY_ADDRESS ? 'primary' : 'secondary'
  } else {
    placeOfEventFields = getPlaceOfEventFields(
      useCase as EventLocationAddressCases
    )
  }

  return [
    ...placeOfEventFields,
    {
      name: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      type: 'SELECT_WITH_OPTIONS',
      label: {
        defaultMessage: 'Country',
        description: 'Title for the country select',
        id: 'form.field.label.country'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: true,
      initialValue: 'FAR',
      validator: [],
      placeholder: {
        defaultMessage: 'Select',
        description: 'Placeholder text for a select',
        id: 'form.field.select.placeholder'
      },
      options: {
        resource: 'countries'
      },
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'country', useCase)
        : getAddressConditionals(section, 'country', useCase),
      mapping: getMapping({
        section,
        type: 'SELECT_WITH_OPTIONS',
        location: 'country',
        useCase,
        fieldName: `country${sentenceCase(useCase)}${sentenceCase(section)}`
      })
    }, // Required
    // Select fields are added for each administrative location level from Humdata
    ...getAdminLevelSelects(section, useCase, addressHierarchy), // Required
    {
      name: `ruralOrUrban${sentenceCase(useCase)}${sentenceCase(section)}`,
      type: 'RADIO_GROUP',
      label: {
        defaultMessage: ' ',
        description: 'Empty label for form field',
        id: 'form.field.label.emptyLabel'
      },
      options: urbanRuralRadioOptions,
      initialValue: 'URBAN',
      flexDirection: FLEX_DIRECTION.ROW,
      required: false,
      hideValueInPreview: true,
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      validator: [],
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'ruralOrUrban', useCase)
        : getAddressConditionals(section, 'ruralOrUrban', useCase),
      mapping: getMapping({
        section,
        type: 'RADIO_GROUP',
        location: '',
        useCase,
        fieldName: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
        fhirLineArrayPosition: 5 // The selected index in the FHIR Address line array to store this value
      })
    },
    {
      name: `city${sentenceCase(useCase)}${sentenceCase(section)}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Town',
        description: 'Title for the address line 4',
        id: 'form.field.label.cityUrbanOption'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'urban', useCase)
        : getAddressConditionals(section, 'urban', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'city',
        useCase,
        fieldName: `city${sentenceCase(useCase)}${sentenceCase(section)}`
      })
    },
    {
      name: `addressLine1UrbanOption${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Residential Area',
        description: 'Title for the address line 1',
        id: 'form.field.label.addressLine1UrbanOption'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'urban', useCase)
        : getAddressConditionals(section, 'urban', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `addressLine1UrbanOption${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 2
      })
    },
    {
      name: `addressLine2UrbanOption${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Street',
        description: 'Title for the address line 2',
        id: 'form.field.label.addressLine2UrbanOption'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'urban', useCase)
        : getAddressConditionals(section, 'urban', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `addressLine2UrbanOption${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 1
      })
    },
    {
      name: `addressLine3UrbanOption${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Number',
        description: 'Title for the number field',
        id: 'form.field.label.number'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'urban', useCase)
        : getAddressConditionals(section, 'urban', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `addressLine3UrbanOption${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 0
      })
    },
    {
      name: `postalCode${sentenceCase(useCase)}${sentenceCase(section)}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Postcode / Zip',
        description: 'Title for the international postcode',
        id: 'form.field.label.internationalPostcode'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'urban', useCase)
        : getAddressConditionals(section, 'urban', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'postalCode',
        useCase,
        fieldName: `postalCode${sentenceCase(useCase)}${sentenceCase(section)}`
      })
    },
    {
      name: `addressLine1RuralOption${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Village',
        description: 'Title for the address line 1',
        id: 'form.field.label.addressLine1RuralOption'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `district${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'rural', useCase)
        : getAddressConditionals(section, 'rural', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `addressLine1RuralOption${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 4
      })
    },
    // INTERNATIONAL ADDRESSES ARE SUPPLIED BECAUSE INFORMANTS & CITIZENS MAY LIVE ABROAD & REGISTER AN EVENT AT ONE OF YOUR FOREIGN EMBASSIES
    // SOMETIMES THIS IS ALSO REQUIRED FOR DIPLOMATIC REASONS OR FOR MILITARY FORCES
    {
      name: `internationalState${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'State',
        description: 'Title for the international state select',
        id: 'form.field.label.internationalState'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: true,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'state',
        useCase,
        fieldName: `internationalState${sentenceCase(useCase)}${sentenceCase(
          section
        )}`
      })
    },
    {
      name: `internationalDistrict${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'District',
        description: 'Title for the international district select',
        id: 'form.field.label.internationalDistrict'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: true,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'district',
        useCase,
        fieldName: `internationalDistrict${sentenceCase(useCase)}${sentenceCase(
          section
        )}`
      })
    },
    {
      name: `internationalCity${sentenceCase(useCase)}${sentenceCase(section)}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'City / Town',
        description: 'Title for the international city select',
        id: 'form.field.label.internationalCity'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'city',
        useCase,
        fieldName: `internationalCity${sentenceCase(useCase)}${sentenceCase(
          section
        )}`
      })
    },
    {
      name: `internationalAddressLine1${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Address Line 1',
        description: 'Title for the international address line 1 select',
        id: 'form.field.label.internationalAddressLine1'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `internationalAddressLine1${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 6
      })
    },
    {
      name: `internationalAddressLine2${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Address Line 2',
        description: 'Title for the international address line 2 select',
        id: 'form.field.label.internationalAddressLine2'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `internationalAddressLine2${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 7
      })
    },
    {
      name: `internationalAddressLine3${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Address Line 3',
        description: 'Title for the international address line 3 select',
        id: 'form.field.label.internationalAddressLine3'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: '',
        useCase,
        fieldName: `internationalAddressLine3${sentenceCase(
          useCase
        )}${sentenceCase(section)}`,
        fhirLineArrayPosition: 8
      })
    },
    {
      name: `internationalPostalCode${sentenceCase(useCase)}${sentenceCase(
        section
      )}`,
      type: 'TEXT',
      label: {
        defaultMessage: 'Postcode / Zip',
        description: 'Title for the international postcode',
        id: 'form.field.label.internationalPostcode'
      },
      previewGroup: isUseCaseForPlaceOfEvent(useCase)
        ? useCase
        : `${useCase}Address`,
      required: false,
      initialValue: '',
      validator: [],
      dependency: `country${sentenceCase(useCase)}${sentenceCase(section)}`,
      conditionals: isUseCaseForPlaceOfEvent(useCase)
        ? getPlaceOfEventConditionals(section, 'international', useCase)
        : getAddressConditionals(section, 'international', useCase),
      mapping: getMapping({
        section,
        type: 'TEXT',
        location: 'postalCode',
        useCase,
        fieldName: `internationalPostalCode${sentenceCase(
          useCase
        )}${sentenceCase(section)}`
      })
    }
  ]
}
