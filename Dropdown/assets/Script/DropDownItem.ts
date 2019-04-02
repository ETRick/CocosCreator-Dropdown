import DropDown from "./DropDown";

const { ccclass, property } = cc._decorator;
@ccclass()
export default class DropDownItem extends cc.Component {

    @property(cc.Label)
    public label: cc.Label = undefined;
    @property(cc.Sprite)
    public sprite: cc.Sprite = undefined;
    @property(cc.Toggle)
    public toggle: cc.Toggle = undefined;
}