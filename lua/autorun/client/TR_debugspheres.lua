-- Lua Library inline imports
function __TS__ArrayForEach(arr, callbackFn)
    do
        local i = 0
        while i < #arr do
            callbackFn(_G, arr[i + 1], i, arr)
            i = i + 1
        end
    end
end

net.Receive(
    "trailers_reborn_debug_spheres",
    function()
        local ventity = net.ReadTable()
        if ventity.input then
            ventity.ent.inputPOS = ventity.input
            timer.Simple(
                1,
                function()
                    ventity.ent.inputPOS = ventity.input
                end
            )
        end
        if ventity.output then
            ventity.ent.outputPOS = ventity.output
            timer.Simple(
                1,
                function()
                    ventity.ent.outputPOS = ventity.output
                end
            )
        end
    end
)
hook.Add(
    "PostDrawTranslucentRenderables",
    "simfphys_trailers_reborn",
    function()
        render.SetColorMaterial()
        __TS__ArrayForEach(
            ents.FindByClass("gmod_sent_vehicle_fphysics_base"),
            function(____, entity)
                if entity.inputPOS then
                    render.DrawSphere(
                        entity:LocalToWorld(entity.inputPOS),
                        10,
                        10,
                        10,
                        Color(255, 0, 0, 100)
                    )
                end
                if entity.outputPOS then
                    render.DrawSphere(
                        entity:LocalToWorld(entity.outputPOS),
                        10,
                        10,
                        10,
                        Color(0, 175, 175, 100)
                    )
                end
            end
        )
    end
)
list.Set(
    "DesktopWindows",
    "Connect Traier",
    {
        title = "Context Menu Icon",
        icon = "icon64/icon.png",
        init = function(____, icon, window)
            print("clicked")
            window:Remove()
        end
    }
)