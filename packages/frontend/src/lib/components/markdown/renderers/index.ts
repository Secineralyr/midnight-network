// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Markdown レンダラーマップ
 * @description SvelteMarkdown に渡す renderers の集約
 *              既定で十分な要素 (em / strong / del / text / rawtext / br / escape / listitem / html) は
 *              ここに含めず、ライブラリ既定のレンダラーにフォールバックさせる
 */

import { KatexRenderer } from '@humanspeak/svelte-markdown/extensions';
import Blockquote from './Blockquote.svelte';
import Code from './Code.svelte';
import Codespan from './Codespan.svelte';
import Heading from './Heading.svelte';
import Hr from './Hr.svelte';
import Image from './Image.svelte';
import Link from './Link.svelte';
import List from './List.svelte';
import Paragraph from './Paragraph.svelte';
import Table from './Table.svelte';
import TableBody from './TableBody.svelte';
import TableCell from './TableCell.svelte';
import TableHead from './TableHead.svelte';
import TableRow from './TableRow.svelte';

export const renderers = {
	heading: Heading,
	paragraph: Paragraph,
	link: Link,
	image: Image,
	list: List,
	blockquote: Blockquote,
	code: Code,
	codespan: Codespan,
	table: Table,
	tablehead: TableHead,
	tablebody: TableBody,
	tablerow: TableRow,
	tablecell: TableCell,
	hr: Hr,
	inlineKatex: KatexRenderer,
	blockKatex: KatexRenderer,
};
