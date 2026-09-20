import { createHash, randomUUID } from 'crypto'

export interface ExternalParticipantInput {
  name?: string
  affiliation?: string
  position?: string
}

const normalizeExternalParticipant = (input: ExternalParticipantInput, requireAffiliation = false) => {
  const name = input.name?.trim()
  const affiliation = input.affiliation?.trim()
  const position = input.position?.trim()

  if (!name) throw new Error('EXTERNAL_PARTICIPANT_NAME_REQUIRED')
  if (requireAffiliation && !affiliation) throw new Error('EXTERNAL_PARTICIPANT_AFFILIATION_REQUIRED')
  if (name.length > 50) throw new Error('EXTERNAL_PARTICIPANT_NAME_TOO_LONG')
  if (affiliation && affiliation.length > 100) throw new Error('EXTERNAL_PARTICIPANT_AFFILIATION_TOO_LONG')
  if (position && position.length > 50) throw new Error('EXTERNAL_PARTICIPANT_POSITION_TOO_LONG')

  return { name, affiliation, position }
}

export const buildExternalParticipantUser = (input: ExternalParticipantInput) => {
  const { name, affiliation, position } = normalizeExternalParticipant(input)

  return {
    name,
    email: `external-${randomUUID()}@studycheck.invalid`,
    userType: affiliation || '외부 대상자',
    position: position || null,
    role: 'USER',
    isAdmin: false,
    mustSetPin: false
  }
}

/**
 * 공개 링크에서 직접 등록하는 외부 참여자는 등록부별로 결정적인 이메일을 사용합니다.
 * 같은 소속+성명은 동일 사용자로 귀결되어 중복 서명을 DB에서도 차단할 수 있습니다.
 */
export const buildSelfRegisteredExternalUser = (
  resourceType: 'training' | 'meeting',
  resourceId: string,
  input: ExternalParticipantInput
) => {
  const { name, affiliation, position } = normalizeExternalParticipant(input, true)
  const identity = `${resourceType}:${resourceId}:${affiliation!.toLocaleLowerCase('ko')}:${name.toLocaleLowerCase('ko')}`
  const digest = createHash('sha256').update(identity).digest('hex').slice(0, 32)

  return {
    name,
    email: `external-self-${digest}@studycheck.invalid`,
    userType: affiliation!,
    position: position || null,
    role: 'USER',
    isAdmin: false,
    mustSetPin: false
  }
}

export const isExternalParticipantEmail = (email: string) => email.endsWith('@studycheck.invalid')
export const isSelfRegisteredExternalEmail = (email: string) => email.startsWith('external-self-') && isExternalParticipantEmail(email)
