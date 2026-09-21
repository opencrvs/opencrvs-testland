import gql from 'graphql-tag'
import { print } from 'graphql/language/printer'

const birthRegistrationFragment = gql`
  fragment BirthRegistrationFragment on BirthRegistration {
    __typename
    _fhirIDMap
    id
    createdAt
    child {
      id
      name {
        use
        firstNames
        familyName
      }
      birthDate
      gender
    }
    informant {
      id
      relationship
      _fhirIDPatient
      identifier {
        id
        type
      }
      name {
        use
        firstNames
        familyName
      }
      occupation
      nationality
      birthDate
      address {
        type
        line
        district
        state
        city
        postalCode
        country
      }
    }
    mother {
      id
      name {
        use
        firstNames
        familyName
      }
      birthDate
      multipleBirth
      maritalStatus
      occupation
      detailsExist
      dateOfMarriage
      educationalAttainment
      nationality
      identifier {
        id
        type
      }
      address {
        type
        line
        district
        state
        city
        postalCode
        country
      }
      telecom {
        system
        value
      }
    }
    father {
      id
      name {
        use
        firstNames
        familyName
      }
      birthDate
      maritalStatus
      occupation
      detailsExist
      dateOfMarriage
      educationalAttainment
      nationality
      identifier {
        id
        type
      }
      address {
        type
        line
        district
        state
        city
        postalCode
        country
      }
      telecom {
        system
        value
      }
      reasonNotApplying
    }
    registration {
      id
      informantType
      contactPhoneNumber
      contactEmail
      attachments {
        data
        uri
        type
        contentType
        subject
      }
      status {
        comments {
          comment
        }
        type
        timestamp
      }
      type
      trackingId
      registrationNumber
    }
    attendantAtBirth
    weightAtBirth
    birthType
    eventLocation {
      id
      type
      address {
        line
        district
        state
        city
        postalCode
        country
      }
    }
    questionnaire {
      fieldId
      value
    }
  }
`

export const MARK_AS_REGISTERED_QUERY = print(gql`
  mutation registerBirthDeclaration(
    $id: ID!
    $details: BirthRegistrationInput!
  ) {
    markBirthAsRegistered(id: $id, details: $details) {
      id
    }
  }
`)

export const MARK_AS_REJECTED_QUERY = print(gql`
  mutation markEventAsVoided(
    $id: String!
    $reason: String!
    $comment: String!
  ) {
    markEventAsVoided(id: $id, reason: $reason, comment: $comment)
  }
`)

export const CREATE_DEATH_DECLARATION = print(gql`
  mutation createDeathDeclaration($details: DeathRegistrationInput!) {
    createDeathRegistration(details: $details) {
      trackingId
      compositionId
    }
  }
`)

export const MARK_BIRTH_AS_CERTIFIED = print(gql`
  mutation markBirthAsCertified($id: ID!, $details: BirthRegistrationInput!) {
    markBirthAsCertified(id: $id, details: $details)
  }
`)

export const MARK_DEATH_AS_CERTIFIED = print(gql`
  mutation markDeathAsCertified($id: ID!, $details: DeathRegistrationInput!) {
    markDeathAsCertified(id: $id, details: $details)
  }
`)

export const MARK_BIRTH_AS_ISSUED = print(gql`
  mutation markBirthAsIssued($id: ID!, $details: BirthRegistrationInput!) {
    markBirthAsIssued(id: $id, details: $details)
  }
`)

export const MARK_DEATH_AS_ISSUED = print(gql`
  mutation markDeathAsIssued($id: ID!, $details: DeathRegistrationInput!) {
    markDeathAsIssued(id: $id, details: $details)
  }
`)

export const SEARCH_EVENTS = print(gql`
  query searchEvents(
    $sort: String
    $advancedSearchParameters: AdvancedSearchParametersInput!
  ) {
    searchEvents(
      advancedSearchParameters: $advancedSearchParameters
      sort: $sort
      sortColumn: "dateOfDeclaration"
      count: 1
    ) {
      results {
        registration {
          dateOfDeclaration
        }
      }
    }
  }
`)
export const MARK_DEATH_AS_REGISTERED = print(gql`
  mutation registerDeathDeclaration(
    $id: ID!
    $details: DeathRegistrationInput!
  ) {
    markDeathAsRegistered(id: $id, details: $details) {
      id
    }
  }
`)

export const FETCH_REGISTRATION_QUERY = print(gql`
  ${birthRegistrationFragment}
  query fetchBirthRegistration($id: ID!) {
    fetchBirthRegistration(id: $id) {
      ...BirthRegistrationFragment
    }
  }
`)

export const FETCH_DEATH_REGISTRATION_QUERY = print(gql`
  query fetchDeathRegistration($id: ID!) {
    fetchDeathRegistration(id: $id) {
      __typename
      _fhirIDMap
      id
      createdAt
      deceased {
        id
        name {
          use
          firstNames
          familyName
        }
        birthDate
        age
        gender
        maritalStatus
        nationality
        identifier {
          id
          type
        }
        gender
        deceased {
          deathDate
        }
        address {
          type
          line
          district
          state
          city
          postalCode
          country
        }
      }
      informant {
        id
        relationship
        _fhirIDPatient
        identifier {
          id
          type
        }
        name {
          use
          firstNames
          familyName
        }
        nationality
        occupation
        birthDate
        telecom {
          system
          value
        }
        address {
          type
          line
          district
          state
          city
          postalCode
          country
        }
      }
      father {
        id
        name {
          use
          firstNames
          familyName
        }
      }
      mother {
        id
        name {
          use
          firstNames
          familyName
        }
      }
      medicalPractitioner {
        name
        qualification
        lastVisitDate
      }
      registration {
        id
        informantType
        contactPhoneNumber
        contactEmail
        attachments {
          data
          uri
          type
          contentType
          subject
        }
        status {
          type
          timestamp
        }
        type
        trackingId
        registrationNumber
      }
      eventLocation {
        id
        type
        address {
          type
          line
          district
          state
          city
          postalCode
          country
        }
      }
      mannerOfDeath
      causeOfDeath
      maleDependentsOfDeceased
      femaleDependentsOfDeceased
      causeOfDeathEstablished
      causeOfDeathMethod
    }
  }
`)

export const getSystemRolesQuery = print(gql`
  query getSystemRoles {
    getSystemRoles(active: true) {
      value
      roles {
        _id
        labels {
          label
        }
      }
    }
  }
`)
