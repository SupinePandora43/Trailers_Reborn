declare namespace debug { function traceback(this: void): string }

resource.AddWorkshop("2083101470")

const connectedSound = file.Exists("sound/vcmod/car_connect.wav", "GAME")

const useConnectSound = CreateConVar("trailers_connectsound", "1", FCVAR.FCVAR_ARCHIVE, "Disables connection sound", 0, 1)

function valid(this: void, callbackfn?: (this: void, ventity: VEntity) => void) {
	Trailers.cars = Trailers.cars.filter((ventity) => { return IsValid(ventity.ent) })
	Trailers.cars.forEach((ventity) => {
		if (ventity.connection && !IsValid(ventity.connection.socket)) {
			ventity.connection = null as any as VConnection
		}
		if (callbackfn) callbackfn(ventity)
	})
}
function findVEntity(this: void, entity: Entity) {
	for (let i = 0; i < Trailers.cars.length; i++) {
		if (Trailers.cars[i].ent == entity)
			return Trailers.cars[i]
	}
	print("not found")
}
function getNext(this: void, ventity: VEntity | undefined) {
	if (ventity && ventity.connection) return findVEntity(ventity.connection.ent)
}
function getwhole(this: void, ventity: VEntity) {
	let buffer: VEntity[] = []
	let current: VEntity | undefined = ventity
	buffer.push(current)
	while (getNext(current) != null) {
		//if (current != null)
		//buffer.push(current)
		current = getNext(current)
		buffer.push(current as VEntity)
	}
	return buffer
}
function IsConnectableTypes(this: void, ctype1?: string, ctype2?: string) {
	if (ctype1 && ctype2) {
		return ctype1 === ctype2
	}
	return true
}
function IsConnectable(this: void, vent1: VEntity, vent2: VEntity, autoconnected?: boolean) {
	if (autoconnected && vent1.lastDisconnected && vent1.lastDisconnected + 10 > CurTime()) return
	if (vent1.outputPos && vent2.inputPos)
		return IsConnectableTypes(vent1.outputType, vent2.inputType) ? vent1.ent.LocalToWorld(vent1.outputPos).DistToSqr(vent2.ent.LocalToWorld(vent2.inputPos)) < 300 : false
}
function GetConnectable(this: void, ventity: VEntity) {
	for (let i = 0; i < Trailers.cars.length; i++) {
		if (ventity == Trailers.cars[i]) continue
		if (IsConnectable(ventity, Trailers.cars[i])) return Trailers.cars[i]
	}
}
namespace Trailers {
	export let cars: VEntity[] = []
	export const systems: System[] = []
	export function Init(this: void, ventity: VEntity) {
		Trailers.cars.push(ventity)
		net.Start("trailers_reborn_debug_spheres", true)
		net.WriteTable({ ent: ventity.ent, input: ventity.inputPos, output: ventity.outputPos })
		net.Broadcast()
	}
	export function Connect(this: void, ventity: VEntity, autoconnected?: boolean) {
		if (!ventity) {
			print("TR: trying to connect nothing")
			print(debug.traceback())
			return
		}
		ventity.hydraulic = undefined
		const whole = getwhole(ventity)
		ventity = whole[whole.length - 1]
		const vtrailer = GetConnectable(ventity) as VEntity
		//if (vent1.lastDisconnected && vent1.lastDisconnected + 10 > CurTime()) return false
		if (vtrailer) {
			//if (ventity.lastDisconnected && v) return
			const ballsocketent = constraint.AdvBallsocket(ventity.ent, vtrailer.ent, 0, 0, ventity.outputPos as Vector, vtrailer.inputPos as Vector, 0, 0, 0, 0, 0, 360, 360, 360, 0, 0, 0, 0, 0)
			ventity.connection = { ent: vtrailer.ent, socket: ballsocketent }
			if (useConnectSound.GetBool()) {
				if (connectedSound) {
					// VCMod Content required
					// https://steamcommunity.com/sharedfiles/filedetails/?id=632470227
					// it's completly free
					ventity.ent.EmitSound("vcmod/car_connect.wav")
				} else {
					// RougeReapr gived sounds
					ventity.ent.EmitSound(`weapons/crowbar/crowbar_impact${math.random(1, 2)}.wav`)
				}
			}
			Trailers.systems.forEach((vsystem) => {
				if (vsystem.Connect) {
					vsystem.Connect(ventity, vtrailer)
				}
			})

		} else {
			print("TR: no connectable trailers found :C")
			ventity.ent.EmitSound("tr/nope.wav")
		}
	}
	export function ConnectEnt(this: void, entity: Entity) {
		valid()
		Trailers.Connect(findVEntity(entity) as VEntity)
	}
	export function Disconnect(this: void, ventity: VEntity | undefined) {
		if (ventity == null) {
			print("TR: ventity == null")
			print(debug.traceback())
			return
		}
		if (ventity.connection) {
			const whole = getwhole(ventity)
			ventity = whole[whole.length - 2] // mafs
			ventity.lastDisconnected = CurTime()
			for (const system of Trailers.systems) {
				if (system.Disconnect) {
					system.Disconnect(ventity)
				}
			}
			SafeRemoveEntity((ventity.connection as VConnection).socket)
			// WHAT ?
			ventity.connection = null as any as VConnection
		} else {
			print("TR: no connections found")
			print(debug.traceback())
		}
	}
	export function DisconnectEnt(this: void, entity: Entity) {
		valid()
		Trailers.Disconnect(findVEntity(entity))
	}
}

/**         */
/** SYSTEMS */
/**         */
const files = file.Find("tr/systems/*", "LUA")[0]
print("TR: initializing systems")
print("| --- SYSTEMS ---")
for (const system of (files as string[])) {
	print("|- " + system)
	Trailers.systems.push(include("tr/systems/" + system) as any as System)
}
print("| --- SYSTEMS ---")

const enum SIZES {
	HYDRAREMOVE = 200
}

/**              */
/** SYSTEM timer */
/**              */
function RestartSystemHandler(this: void) {
	const autoconnect = CreateConVar("trailers_autoconnect", "1", FCVAR.FCVAR_ARCHIVE, "some help", 0, 1).GetBool()
	const hydrahelp = CreateConVar("trailers_hydrahelp", "1", FCVAR.FCVAR_ARCHIVE, "some help", 0, 1).GetBool()
	const autoconnectDist = CreateConVar("trailers_autoconnect_distance", "5", FCVAR.FCVAR_ARCHIVE, "maximum Distance when trailer get automatically connected", 0, 1000).GetInt()
	timer.Remove("TR_system")
	print("created timer")
	if (!autoconnect) {
		timer.Create("TR_system", 0.2, 0, () => {
			valid((ventity: VEntity) => {
				for (const system of Trailers.systems) {
					if (system.HandleTruck) {
						system.HandleTruck(ventity)
					}
				}
			})
		})
	} else if (autoconnect && hydrahelp) {
		timer.Create("TR_system", 0.2, 0, () => {
			valid((ventity: VEntity) => {
				for (const system of Trailers.systems) {
					if (system.HandleTruck) {
						system.HandleTruck(ventity)
					}
				}
				if (!ventity.connection && ventity.outputPos) {
					if (!ventity.phys) {
						ventity.phys = ventity.ent.GetPhysicsObject()
					}
					Trailers.cars.forEach((val) => {
						if (val != ventity) {
							if (!val.phys) {
								val.phys = val.ent.GetPhysicsObject()
							}
							if (val.inputPos) {
								const outputPosWorld = ventity.ent.LocalToWorld(ventity.outputPos as Vector)
								const inputPosWorld = val.ent.LocalToWorld(val.inputPos as Vector)
								const distance = outputPosWorld.DistToSqr(inputPosWorld)
								if (IsValid(ventity.hydraulic) && distance > SIZES.HYDRAREMOVE) {
									print("TR: autoconnection cancelled")
									SafeRemoveEntity(ventity.hydraulic as Entity)
									ventity.hydraulic = undefined
								}
								else if (IsConnectable(ventity, val, true) && distance < autoconnectDist) {
									print("TR: connected trailer using autoconnection")
									SafeRemoveEntity(ventity.hydraulic as Entity)
									Trailers.Connect(ventity, true)
									ventity.hydraulic = undefined
								} else if (IsConnectable(ventity, val, true) && !ventity.hydraulic) {
									const hydraulic = constraint.Hydraulic(null as any as Player, ventity.ent, val.ent, 0, 0, ventity.outputPos as Vector, val.inputPos, 0, 0, 0, KEY.KEY_PAD_MULTIPLY, 0, 10000000, null as any, false)
									const hydraulic2 = constraint.Hydraulic(null as any as Player, ventity.ent, val.ent, 0, 0, ventity.outputPos as Vector, val.inputPos, 0, 0, 0, KEY.KEY_PAD_MULTIPLY, 0, 10000000, null as any, false)
									const hydraulic3 = constraint.Hydraulic(null as any as Player, ventity.ent, val.ent, 0, 0, ventity.outputPos as Vector, val.inputPos, 0, 0, 0, KEY.KEY_PAD_MULTIPLY, 0, 10000000, null as any, false)
									numpad.Activate(null as any as Player, KEY.KEY_PAD_MULTIPLY, true);
									(hydraulic as any as Entity).DeleteOnRemove(hydraulic2 as any as Entity);
									(hydraulic as any as Entity).DeleteOnRemove(hydraulic3 as any as Entity);
									ventity.hydraulic = hydraulic as any as Entity
									/*const traceResult = util.TraceLine({
										start: outputPosWorld,
										endpos: inputPosWorld
									} as Trace)
									traceResult.Normal.Mul(10000 * traceResult.Fraction)
									ventity.phys?.ApplyForceOffset(traceResult.Normal, outputPosWorld)
									traceResult.Normal.Mul(-1)
									val.phys?.ApplyForceOffset(traceResult.Normal, inputPosWorld)
									ventity.ent.GetPhysicsObject().ApplyForceOffset(Vector(traceResult.Normal.x * -1, traceResult.Normal.y * -1, traceResult.Normal.z * -1), outputPosWorld)
									val.ent.GetPhysicsObject().ApplyForceOffset(traceResult.Normal, val.ent.LocalToWorld(val.inputPos))*/
								}
							}
						}
					})
				}
			})
		})
	} else {
		timer.Create("TR_system", 0.2, 0, () => {
			valid((ventity: VEntity) => {
				for (const system of Trailers.systems) {
					if (system.HandleTruck) {
						system.HandleTruck(ventity)
					}
				}
				if (!ventity.connection && ventity.outputPos) {
					if (!ventity.phys) {
						ventity.phys = ventity.ent.GetPhysicsObject()
					}
					Trailers.cars.forEach((val) => {
						if (val != ventity) {
							if (!val.phys) {
								val.phys = val.ent.GetPhysicsObject()
							}
							if (val.inputPos) {
								const outputPosWorld = ventity.ent.LocalToWorld(ventity.outputPos as Vector)
								const inputPosWorld = val.ent.LocalToWorld(val.inputPos as Vector)
								const distance = outputPosWorld.DistToSqr(inputPosWorld)
								if (IsConnectable(ventity, val, true) && distance < autoconnectDist) {
									print("TR: connected trailer using autoconnection")
									Trailers.Connect(ventity, true)
								}
							}
						}
					})
				}
			})
		})
	}
}
RestartSystemHandler()
concommand.Add("trailers_reload_SV_systemtimer", RestartSystemHandler)
list.Set("FLEX", "Trailers", (ent, vtable) => {
	if (istable(vtable)) {
		Trailers.Init({
			ent: ent,
			inputPos: vtable.inputPos,
			outputPos: vtable.outputPos,
			inputType: vtable.inputType,
			outputType: vtable.outputType
		})
	} else {
		print("TR: seems like vehicle's 'Trailers' spawnlist is wrong")
	}
})
concommand.Add("trailers_connect", (ply: Player | any) => {
	if (IsValid(ply)) {
		print(ply.GetSimfphys())
		Trailers.ConnectEnt(ply.GetSimfphys())
	} else {
		print("TR: IsValid(ply) == false")
		print(debug.traceback())
	}
})
concommand.Add("trailers_disconnect", (ply: Player | any) => {
	if (IsValid(ply)) {
		print(ply.GetSimfphys())
		Trailers.DisconnectEnt(ply.GetSimfphys())
	} else {
		print("TR: IsValid(ply) == false")
		print(debug.traceback())
	}
})
/* **PREDICTED** it causes me to use it on server, if i used it on client, i probably need to RunConsoleCommand */
hook.Add("PlayerButtonDown", "TR_binds", (ply: Player | any, button: number) => {
	if (IsValid(ply)) {
		if (button == ply.GetInfoNum("trailers_disconnect_key", KEY.KEY_PAD_MINUS)) {
			const vehicle = ply.GetSimfphys()
			if (IsValid(vehicle)) {
				Trailers.DisconnectEnt(vehicle)
			}
		}
		else if (button == ply.GetInfoNum("trailers_connect_key", KEY.KEY_PAD_PLUS)) {
			const vehicle = ply.GetSimfphys()
			if (IsValid(vehicle)) {
				Trailers.ConnectEnt(vehicle)
			}
		}
	}
})
util.AddNetworkString("trailers_reborn_debug_spheres")
_G["Trailers"] = Trailers
print("TR: loaded")
export { }
