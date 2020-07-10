
const SYSTEM: System = {
	HandleTruck(this: void, ventity: VEntity | any) {
		if (ventity.connection) {
			const truck = ventity.ent as any
			const trailer = ventity.connection.ent as any
			trailer.trailers_systems_base_active = truck.EngineActive() || truck.trailers_systems_base_active
			trailer.SetActive(trailer.trailers_systems_base_active)
			trailer.SetActive(true)
			const brakes = truck.GetIsBraking() // || truck.GetHandBrakeEnabled()
			//trailer.PressedKeys["joystick_handbrake"] = brakes ? 1 : 0
			//trailer.SetHandBrakeEnabled(brakes)

			trailer.SetEMSEnabled(brakes)
			trailer.SetLightsEnabled(truck.GetLightsEnabled())
			trailer.SetFogLightsEnabled(truck.GetFogLightsEnabled())

			// Disabling Brakes
			trailer.PressedKeys["joystick_throttle"] = truck.EngineActive() && !(truck.GearRatio < 0) ? 1 : 0

			// Reverse Lights
			// Brakes
			trailer.PressedKeys["joystick_brake"] = truck.PressedKeys["S"] ? 1 : truck.PressedKeys["joystick_brake"]
			// Handbrake
			trailer.PressedKeys["joystick_handbrake"] = truck.PressedKeys["Space"] ? 1 : truck.PressedKeys["joystick_handbrake"]

			let turndirection = truck.TSMode || 0
			trailer.TSMode = turndirection
			net.Start("simfphys_turnsignal")
			net.WriteEntity(trailer)
			net.WriteInt(turndirection, 32)
			net.Broadcast()
			/* if ent:SimfIsTrailer() ~= nil then
			if not ent:GetIsBraking() then
				ent.ForceTransmission = 1
				if ent:GetNWBool("zadnyaya_gear", false) then
					ent.PressedKeys["joystick_throttle"] = 0 -- makes thottle to 0 when reverse, for remove handbrake
					ent.PressedKeys["joystick_brake"] = 1 -- makes brake to 1, for turn on reverse
				else
					ent.PressedKeys["joystick_throttle"] = 1 -- makes thottle to 1, for remove handbrake
					ent.PressedKeys["joystick_brake"] = 0 -- makes brake to 0, for turn off reverse
				end
			end
		*/
		}
	},
	Disconnect(this: void, ventity: VEntity) {
		if (ventity.connection && IsValid(ventity.connection.ent)) {
			const trailer = ventity.connection.ent as any
			trailer.SetActive(false)
			trailer.PressedKeys["joystick_throttle"] = 0
			trailer.PressedKeys["joystick_brake"] = 0
			//trailer.PressedKeys["joystick_handbrake"]
		}
	}
}
export = SYSTEM
