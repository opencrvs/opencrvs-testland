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
interface BirthNotification {
  child: {
    firstName: string
    lastName: string
    weight: string // in kg
    gender: 'male' | 'female' | 'unknown'
  }
  father: {
    firstName: string
    lastName: string
    nid: string
    dateOfBirth: string
  }
  mother: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nid: string
  }
  phoneNumber: string
  email: string
  address: fhir.Address[]
  dateOfBirth: string
  placeOfBirth: string // Location Resource
  createdAt: string
  officeLocation: string
  office: string
}

export function birthNotification({
  child,
  father,
  mother,
  phoneNumber,
  email,
  address,
  dateOfBirth,
  placeOfBirth,
  createdAt,
  officeLocation,
  office
}: BirthNotification) {
  return {
    resourceType: 'Bundle',
    type: 'document',
    meta: {
      lastUpdated: createdAt
    },
    entry: [
      {
        fullUrl: 'urn:uuid:37dd8e55-69c0-493d-b1a0-b7462a1d806a',
        resource: {
          identifier: {
            system: 'urn:ietf:rfc:3986',
            value: '8f793c5a-3d53-4c9b-898b-1c04759716c6'
          },
          resourceType: 'Composition',
          status: 'final',
          type: {
            coding: [
              {
                system: 'http://opencrvs.org/doc-types',
                code: 'birth-notification'
              }
            ],
            text: 'Birth Notification'
          },
          class: {
            coding: [
              {
                system: 'http://opencrvs.org/specs/classes',
                code: 'crvs-document'
              }
            ],
            text: 'CRVS Document'
          },
          subject: {
            reference: 'urn:uuid:760c393e-4dc3-4572-83f6-b70765963ef1'
          },
          date: createdAt,
          author: [],
          title: 'Birth Notification',
          section: [
            {
              title: 'Child details',
              code: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/sections',
                    code: 'child-details'
                  }
                ],
                text: 'Child details'
              },
              entry: [
                {
                  reference: 'urn:uuid:760c393e-4dc3-4572-83f6-b70765963ef1'
                }
              ]
            },
            {
              title: 'Birth encounter',
              code: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/sections',
                    code: 'birth-encounter'
                  }
                ],
                text: 'Birth encounter'
              },
              entry: [
                {
                  reference: 'urn:uuid:7cb1d9cc-ea4b-4046-bea0-38bdf3082f56'
                }
              ]
            },
            {
              title: "Mother's details",
              code: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/sections',
                    code: 'mother-details'
                  }
                ],
                text: "Mother's details"
              },
              entry: [
                {
                  reference: 'urn:uuid:d9d3a8c8-6a47-47a1-be86-0493a4ec55a7'
                }
              ]
            },
            {
              title: "Informant's details",
              code: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/sections',
                    code: 'informant-details'
                  }
                ],
                text: "Informant's details"
              },
              entry: [
                {
                  reference: 'urn:uuid:b74fbd0e-8536-4c11-833d-781e89a4b553'
                }
              ]
            },
            {
              title: "Father's details",
              code: {
                coding: [
                  {
                    system: 'http://opencrvs.org/doc-sections',
                    code: 'father-details'
                  }
                ],
                text: "Father's details"
              },
              entry: [
                {
                  reference: 'urn:uuid:ad1e15bb-51da-449a-8a12-c7dae10728e4'
                }
              ]
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:8546aaf3-8a60-4150-bc24-ab5579bc0fa2',
        resource: {
          resourceType: 'Task',
          status: 'draft',
          intent: 'unknown',
          identifier: [],
          code: {
            coding: [
              {
                system: 'http://opencrvs.org/specs/types',
                code: 'BIRTH'
              }
            ]
          },
          focus: {
            reference: 'urn:uuid:37dd8e55-69c0-493d-b1a0-b7462a1d806a'
          },
          extension: [
            {
              url: 'http://opencrvs.org/specs/extension/contact-person',
              valueString: 'MOTHER'
            },
            {
              url: 'http://opencrvs.org/specs/extension/contact-person-phone-number',
              valueString: phoneNumber
            },
            {
              url: 'http://opencrvs.org/specs/extension/contact-person-email',
              valueString: email
            },
            {
              url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
              valueInteger: 0
            },
            {
              url: 'http://opencrvs.org/specs/extension/in-complete-fields',
              valueString: 'N/A'
            },
            {
              url: 'http://opencrvs.org/specs/extension/regLastLocation',
              valueReference: {
                reference: officeLocation
              }
            },
            {
              url: 'http://opencrvs.org/specs/extension/regLastOffice',
              valueReference: {
                reference: office
              }
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:760c393e-4dc3-4572-83f6-b70765963ef1',
        resource: {
          resourceType: 'Patient',
          active: true,
          name: [
            {
              use: 'en',
              family: child.lastName,
              given: [child.firstName]
            }
          ],
          gender: child.gender,
          birthDate: dateOfBirth,
          deceasedBoolean: false,
          multipleBirthBoolean: false
        }
      },
      {
        fullUrl: 'urn:uuid:d9d3a8c8-6a47-47a1-be86-0493a4ec55a7',
        resource: {
          resourceType: 'Patient',
          active: true,
          identifier: [
            {
              use: 'official',
              type: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/identifier-type',
                    code: 'NATIONAL_ID'
                  }
                ]
              },
              value: mother.nid
            }
          ],
          name: [
            {
              use: 'en',
              family: mother.lastName,
              given: [mother.firstName]
            }
          ],
          gender: 'female',
          telecom: [
            {
              use: 'mobile',
              system: 'phone',
              value: phoneNumber
            }
          ],
          birthDate: mother.dateOfBirth,
          deceasedBoolean: false,
          multipleBirthInteger: 2,
          maritalStatus: {
            coding: [
              {
                system:
                  'http://hl7.org/fhir/StructureDefinition/marital-status',
                code: 'M'
              }
            ],
            text: 'MARRIED'
          },
          address,
          extension: [
            {
              url: 'http://opencrvs.org/specs/extension/patient-occupation',
              valueString: 'Housewife'
            },
            {
              url: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
              extension: [
                {
                  url: 'code',
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: 'urn:iso:std:iso:3166',
                        code: 'FAR'
                      }
                    ]
                  }
                },
                {
                  url: 'period',
                  valuePeriod: {
                    start: '',
                    end: ''
                  }
                }
              ]
            },
            {
              url: 'http://opencrvs.org/specs/extension/educational-attainment',
              valueString: 'POST_SECONDARY_ISCED_4'
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:b74fbd0e-8536-4c11-833d-781e89a4b553',
        resource: {
          resourceType: 'RelatedPerson',
          relationship: {
            coding: [
              {
                system:
                  'http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype',
                code: 'MOTHER'
              }
            ]
          },
          patient: {
            reference: 'urn:uuid:d9d3a8c8-6a47-47a1-be86-0493a4ec55a7'
          }
        }
      },
      {
        fullUrl: 'urn:uuid:ad1e15bb-51da-449a-8a12-c7dae10728e4',
        resource: {
          resourceType: 'Patient',
          active: true,
          identifier: [
            {
              use: 'official',
              type: {
                coding: [
                  {
                    system: 'http://opencrvs.org/specs/identifier-type',
                    code: 'NATIONAL_ID'
                  }
                ]
              },
              value: father.nid
            }
          ],
          name: [
            {
              use: 'en',
              family: father.firstName,
              given: [father.lastName]
            }
          ],
          gender: 'male',
          telecom: [],
          birthDate: father.dateOfBirth,
          deceasedBoolean: false,
          multipleBirthInteger: 2,
          maritalStatus: {
            coding: [
              {
                system:
                  'http://hl7.org/fhir/StructureDefinition/marital-status',
                code: 'M'
              }
            ],
            text: 'MARRIED'
          },
          address,
          extension: [
            {
              url: 'http://opencrvs.org/specs/extension/patient-occupation',
              valueString: 'Businessman'
            },
            {
              url: 'http://hl7.org/fhir/StructureDefinition/patient-nationality',
              extension: [
                {
                  url: 'code',
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: 'urn:iso:std:iso:3166',
                        code: 'FAR'
                      }
                    ]
                  }
                },
                {
                  url: 'period',
                  valuePeriod: {
                    start: '',
                    end: ''
                  }
                }
              ]
            },
            {
              url: 'http://opencrvs.org/specs/extension/educational-attainment',
              valueString: 'POST_SECONDARY_ISCED_4'
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:7cb1d9cc-ea4b-4046-bea0-38bdf3082f56',
        resource: {
          resourceType: 'Encounter',
          status: 'finished',
          location: [
            {
              location: {
                reference: placeOfBirth
              }
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:45c68568-2ca0-4932-9731-535dd4180fe0',
        resource: {
          resourceType: 'Observation',
          status: 'final',
          context: {
            reference: 'urn:uuid:7cb1d9cc-ea4b-4046-bea0-38bdf3082f56'
          },
          category: [
            {
              coding: [
                {
                  system: 'http://hl7.org/fhir/observation-category',
                  code: 'procedure',
                  display: 'Procedure'
                }
              ]
            }
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '57722-1',
                display: 'Birth plurality of Pregnancy'
              }
            ]
          },
          valueQuantity: {
            value: 'SINGLE'
          }
        }
      },
      {
        fullUrl: 'urn:uuid:d2d3d5b8-658e-4c29-9ec5-cb2431b4ddf3',
        resource: {
          resourceType: 'Observation',
          status: 'final',
          context: {
            reference: 'urn:uuid:7cb1d9cc-ea4b-4046-bea0-38bdf3082f56'
          },
          category: [
            {
              coding: [
                {
                  system: 'http://hl7.org/fhir/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs'
                }
              ]
            }
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '3141-9',
                display: 'Body weight Measured'
              }
            ]
          },
          valueQuantity: {
            value: child.weight,
            unit: 'kg',
            system: 'http://unitsofmeasure.org',
            code: 'kg'
          }
        }
      }
    ]
  }
}
