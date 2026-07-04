import {type FromLeaves, type Leaves} from "./utils"
import {type Data} from "./index"

export type DataFunction<D extends Data, N = never> = {
	<L extends Leaves<D, N>>(leaves: L): FromLeaves<D, L, N>
} & D

export const toDataFunction = <D extends Data>(data: D): DataFunction<D> => {
	const translation = (leaves: Leaves<D>) => {
		let value: unknown = data

		for (const key of leaves.split(".")) {
			value = (value as Record<string, unknown>)[key]
		}

		return value
	}

	return Object.assign(translation, data) as DataFunction<D>
}
