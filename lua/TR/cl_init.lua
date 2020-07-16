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

local ____exports = {}
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
local enableSpheres = CreateConVar("trailers_spheres", "0", FCVAR_ARCHIVE, "render spheres?", 0, 1)
local function InitSpheres()
    hook.Remove("PostDrawTranslucentRenderables", "simfphys_trailers_reborn")
    if enableSpheres:GetBool() then
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
    end
    print("TR: spheres renderer initializated")
end
InitSpheres()
concommand.Add("trailers_reload_CL", InitSpheres, nil, "reloads client side of TR")
list.Set(
    "FLEX_UI",
    "TR_UI",
    function(layout)
        local row = vgui.Create("DTileLayout")
        row:SetBackgroundColor(
            Color(0, 255, 255, 255)
        )
        local connnectBTN = vgui.Create("DButton", row)
        connnectBTN:SetSize(100, 50)
        connnectBTN:SetText("Connect")
        connnectBTN.DoClick = function()
            RunConsoleCommand("trailers_connect")
        end
        local disconnectBTN = vgui.Create("DButton", row)
        disconnectBTN:SetSize(100, 50)
        disconnectBTN:SetText("Disconnect")
        disconnectBTN.DoClick = function()
            RunConsoleCommand("trailers_disconnect")
        end
        layout:Add(row)
    end
)
local function buildthemenu(self, pnl)
    local Background = vgui.Create("DShape", pnl.PropPanel)
    Background:SetType("Rect")
    Background:SetPos(20, 20)
    Background:SetColor(
        Color(0, 0, 0, 200)
    )
    Background:SetSize(350, 25)
    local spheresCheckbox = vgui.Create("DCheckBoxLabel", pnl.PropPanel)
    spheresCheckbox:SetPos(25, 25)
    spheresCheckbox:SetText("draw Spheres")
    spheresCheckbox.OnChange = function()
        InitSpheres()
    end
    spheresCheckbox:SetConVar("trailers_spheres")
    spheresCheckbox:SizeToContents()
    if LocalPlayer():IsSuperAdmin() then
        local Background1 = vgui.Create("DShape", pnl.PropPanel)
        Background1:SetType("Rect")
        Background1:SetPos(20, 50 + 20)
        Background1:SetColor(
            Color(0, 0, 0, 200)
        )
        Background1:SetSize(350, 100)
        local Label = vgui.Create("DLabel", pnl.PropPanel)
        Label:SetPos(30, 50)
        Label:SetText("Admin-Only Settings!")
        Label:SizeToContents()
        local autoconnectCheckbox = vgui.Create("DCheckBoxLabel", pnl.PropPanel)
        autoconnectCheckbox:SetPos(25, 75)
        autoconnectCheckbox:SetText("Autoconnect")
        autoconnectCheckbox.OnChange = function()
            RunConsoleCommand("trailers_reload_SV_systemtimer")
        end
        autoconnectCheckbox:SetConVar("trailers_autoconnect")
        autoconnectCheckbox:SizeToContents()
        autoconnectCheckbox:SetTooltip("Automatically connects trailer to truck")
        local hydrahelpCheckbox = vgui.Create("DCheckBoxLabel", pnl.PropPanel)
        hydrahelpCheckbox:SetPos(25, 100)
        hydrahelpCheckbox:SetText("Hydraulic connectoin")
        hydrahelpCheckbox.OnChange = function()
            RunConsoleCommand("trailers_reload_SV_systemtimer")
        end
        hydrahelpCheckbox:SetConVar("trailers_hydrahelp")
        hydrahelpCheckbox:SizeToContents()
        hydrahelpCheckbox:SetTooltip("Add some hydraulics to help\n!BUGGY!")
        local DamageMul = vgui.Create("DNumSlider", pnl.PropPanel)
        DamageMul:SetPos(30, 125)
        DamageMul:SetSize(345, 30)
        DamageMul:SetText("Autoconnect distance")
        DamageMul:SetTooltip("uses DistToSqr")
        DamageMul:SetMin(0)
        DamageMul:SetMax(1000)
        DamageMul:SetDecimals(0)
        DamageMul:SetConVar("trailers_autoconnect_distance")
        DamageMul.OnValueChanged = function()
            RunConsoleCommand("trailers_reload_SV_systemtimer")
        end
    end
end
hook.Add(
    "SimfphysPopulateVehicles",
    "TR_config",
    function(pc, t, n)
        local node = t:AddNode("Trailers Reborn", "icon16/wrench_orange.png")
        node.DoPopulate = function(self)
            if self.PropPanel then
                return
            end
            self.PropPanel = vgui.Create("ContentContainer", pc)
            self.PropPanel:SetVisible(false)
            self.PropPanel:SetTriggerSpawnlistChange(false)
            buildthemenu(nil, self)
        end
        node.DoClick = function(self)
            self:DoPopulate()
            pc:SwitchPanel(self.PropPanel)
        end
    end
)
return ____exports
