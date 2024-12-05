import fs from 'fs'
import { compile } from 'json-schema-to-typescript'

// import type { SanitizedConfig } from '../config/types.js'

// import { addSelectGenericsToGeneratedTypes } from '../utilities/addSelectGenericsToGeneretedTypes.js'
// import { configToJSONSchema } from '../utilities/configToJSONSchema.js'
// import { getLogger } from '../utilities/logger.js'

export async function generateTypes(
  config: any, // SanitizedConfig,
  options?: { log: boolean },
): Promise<void> {
  // const logger = getLogger('payload', 'sync')
  const outputFile = process.env.PAYLOAD_TS_OUTPUT_PATH || config.typescript.outputFile

  const shouldLog = options?.log ?? true

  if (shouldLog) {
    // logger.info('Compiling TS types for Collections and Globals...')
  }

  const jsonSchema = {} //configToJSONSchema(config, config.db.defaultIDType)

  const declare = `declare module 'ai-functions' {\n  export interface GeneratedTypes extends Config {}\n}`
  const declareWithTSIgnoreError = `declare module 'ai-functions' {\n  // @ts-ignore \n  export interface GeneratedTypes extends Config {}\n}`

  let compiled = await compile(jsonSchema, 'Config', {
    bannerComment:
      '/* tslint:disable */\n/* eslint-disable */\n/**\n* This file was automatically generated by ai-functions.\n* DO NOT MODIFY IT BY HAND. Instead, modify your source ai.config.ts,\n* and re-run `ai-functions generate:types` to regenerate this file.\n*/',
    style: {
      singleQuote: true,
      semi: false,
    },
    // Generates code for $defs that aren't referenced by the schema. Reason:
    // If a field defines an interfaceName, it should be included in the generated types
    // even if it's not used by another type. Reason: the user might want to use it in their own code.
    unreachableDefinitions: true,
  })

  compiled = '' //addSelectGenericsToGeneratedTypes({ compiledGeneratedTypes: compiled })

  if (config.typescript.declare !== false) {
    if (config.typescript.declare?.ignoreTSError) {
      compiled += `\n\n${declareWithTSIgnoreError}`
    } else {
      compiled += `\n\n${declare}`
    }
  }

  // Diff the compiled types against the existing types file
  try {
    const existingTypes = fs.readFileSync(outputFile, 'utf-8')

    if (compiled === existingTypes) {
      return
    }
  } catch (_) {
    // swallow err
  }

  fs.writeFileSync(outputFile, compiled)
  if (shouldLog) {
    // logger.info(`Types written to ${outputFile}`)
  }
}