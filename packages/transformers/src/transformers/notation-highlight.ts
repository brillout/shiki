import type { ShikiTransformer } from '@shikijs/types'
import type { Element } from 'hast'
import type { MatchAlgorithmOptions } from '../shared/notation-transformer'

import { createCommentNotationTransformer } from '../shared/notation-transformer'

const RE_CODE_HIGHLIGHT = /#?\s*\[!code (highlight|hl)(?::((?:\\.|[^:\]])+))?(?::(\d+))?\]/i
const RE_NUMERIC_ARGUMENT = /^\d+$/
const HIGHLIGHT_STYLE_PROPERTY = 'background-color'

export interface TransformerNotationHighlightOptions extends MatchAlgorithmOptions {
  /**
   * Class for highlighted lines
   */
  classActiveLine?: string
  /**
   * Class added to the root element when the code has highlighted lines
   */
  classActivePre?: string
  /**
   * Class added to the <code> element when the code has highlighted lines
   */
  classActiveCode?: string
}

/**
 * Allow using `[!code highlight]` notation in code to mark highlighted lines.
 */
export function transformerNotationHighlight(
  options: TransformerNotationHighlightOptions = {},
): ShikiTransformer {
  const {
    classActiveLine = 'highlighted',
    classActivePre = 'has-highlighted',
    classActiveCode,
  } = options

  return createCommentNotationTransformer(
    '@shikijs/transformers:notation-highlight',
    RE_CODE_HIGHLIGHT,
    function ([_, _match, arg, explicitRange], _line, _comment, lines, index) {
      const color = explicitRange
        ? arg
        : arg && !RE_NUMERIC_ARGUMENT.test(arg)
          ? arg
          : undefined
      const lineNum = Number.parseInt(explicitRange || (color ? '1' : arg || '1'), 10)

      for (let i = index; i < Math.min(index + lineNum, lines.length); i++) {
        this.addClassToHast(lines[i], classActiveLine)
        if (color)
          addStyleProperty(lines[i], HIGHLIGHT_STYLE_PROPERTY, color)
      }

      if (classActivePre)
        this.addClassToHast(this.pre, classActivePre)
      if (classActiveCode)
        this.addClassToHast(this.code, classActiveCode)
      return true
    },
    options.matchAlgorithm,
  )
}

function addStyleProperty(node: Element, property: string, value: string): void {
  const current = typeof node.properties.style === 'string'
    ? node.properties.style.trim()
    : ''
  const declaration = `${property}:${value}`

  node.properties.style = current
    ? `${current}${current.endsWith(';') ? '' : ';'}${declaration}`
    : declaration
}
