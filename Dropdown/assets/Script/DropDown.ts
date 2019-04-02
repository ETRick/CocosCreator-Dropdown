import DropDownOptionData from "./DropDownOptionData";
import DropDownItem from "./DropDownItem";

const { ccclass, property } = cc._decorator;

@ccclass()
export default class DropDown extends cc.Component {
    @property(cc.Node)
    private template: cc.Node = undefined;
    @property(cc.Label)
    private labelCaption: cc.Label = undefined;
    @property(cc.Sprite)
    private spriteCaption: cc.Sprite = undefined;
    @property(cc.Label)
    private labelItem: cc.Label = undefined;
    @property(cc.Sprite)
    private spriteItem: cc.Sprite = undefined;

    @property([DropDownOptionData])
    private optionDatas: DropDownOptionData[] = [];

    private _dropDown: cc.Node;
    private validTemplate: boolean = false;
    private items: DropDownItem[] = [];
    private isShow: boolean = false;

    private _selectedIndex: number = -1;
    private get selectedIndex(): number{
        return this._selectedIndex;
    }
    private set selectedIndex(value: number){
        this._selectedIndex = value;
        this.refreshShownValue();
    }

    public addOptionDatas(optionDatas: DropDownOptionData[]) {
        optionDatas && optionDatas.forEach(data=>{
            this.optionDatas.push(data);
        });
        this.refreshShownValue();
    }

    public clearOptionDatas(){
        cc.js.clear(this.optionDatas);
        this.refreshShownValue();
    }

    public show() {
        if (!this.validTemplate) {
            this.setUpTemplate();
            if (!this.validTemplate) { return; }
        }
        this.isShow = true;

        this._dropDown = this.createDropDownList(this.template);
        this._dropDown.name = "DropDown List";
        this._dropDown.active = true;
        this._dropDown.setParent(this.template.parent);

        let itemTemplate = this._dropDown.getComponentInChildren<DropDownItem>(DropDownItem);
        let content = itemTemplate.node.parent;
        itemTemplate.node.active = true;

        cc.js.clear(this.items);

        for(let i =0, len = this.optionDatas.length; i < len; i++){
            let data = this.optionDatas[i];
            let item : DropDownItem = this.addItem(data, i == this.selectedIndex, itemTemplate, this.items);
            if(!item){
                continue;
            }
            item.toggle.isChecked = i == this.selectedIndex;
            item.toggle.node.on("toggle", this.onSelectedItem, this);
            // if(i == this.selectedIndex){
            //     this.onSelectedItem(item.toggle);
            // }
        }
        itemTemplate.node.active = false;

        content.height = itemTemplate.node.height * this.optionDatas.length;
    }

    private addItem(data: DropDownOptionData, selected: boolean, itemTemplate: DropDownItem, dropDownItems: DropDownItem[]): DropDownItem{
        let item = this.createItem(itemTemplate);
        item.node.setParent(itemTemplate.node.parent);
        item.node.active = true;
        item.node.name = `item_${this.items.length + data.optionString?data.optionString:""}`;
        if(item.toggle){
            item.toggle.isChecked = false;
        } 
        if(item.label){
            item.label.string = data.optionString;
        }
        if(item.sprite){
            item.sprite.spriteFrame = data.optionSf;
            item.sprite.enabled = data.optionSf != undefined;
        }
        this.items.push(item);
        return item;
    }

    public hide() {
        this.isShow = false;
        if(this._dropDown != undefined){
            this.delayedDestroyDropdownList(0.15);
        }
    }

    private async delayedDestroyDropdownList(delay: number)
    {
        // await WaitUtil.waitForSeconds(delay);
        // wait delay;
        for (let i = 0, len= this.items.length; i < len; i++)
        {
            if (this.items[i] != undefined)
                this.destroyItem(this.items[i]);
        }
        cc.js.clear(this.items);
        if (this._dropDown != undefined)
            this.destroyDropDownList(this._dropDown);
        this._dropDown = undefined;
    }

    private destroyItem(item){

    }

    // 设置模板，方便后面item
    private setUpTemplate() {
        this.validTemplate = false;

        if (!this.template) {
            cc.error("The dropdown template is not assigned. The template needs to be assigned and must have a child GameObject with a Toggle component serving as the item");
            return;
        }
        this.template.active = true;
        let itemToggle: cc.Toggle = this.template.getComponentInChildren<cc.Toggle>(cc.Toggle);
        this.validTemplate = true;
        // 一些判断
        if (!itemToggle || itemToggle.node == this.template) {
            this.validTemplate = false;
            cc.error("The dropdown template is not valid. The template must have a child Node with a Toggle component serving as the item.");
        } else if (this.labelItem != undefined && !this.labelItem.node.isChildOf(itemToggle.node)) {
            this.validTemplate = false;
            cc.error("The dropdown template is not valid. The Item Label must be on the item Node or children of it.");
        } else if (this.spriteItem != undefined && !this.spriteItem.node.isChildOf(itemToggle.node)) {
            this.validTemplate = false;
            cc.error("The dropdown template is not valid. The Item Sprite must be on the item Node or children of it.");
        }

        if (!this.validTemplate)
        {
            this.template.active = false;
            return;
        }
        let item = itemToggle.node.addComponent<DropDownItem>(DropDownItem);
        item.label = this.labelItem;
        item.sprite = this.spriteItem;
        item.toggle = itemToggle;
        item.node = itemToggle.node;

        this.template.active = false;
        this.validTemplate = true;
    }

    // 刷新显示的选中信息
    private refreshShownValue(){
        if(this.optionDatas.length <= 0){
            return;
        }
        let data = this.optionDatas[this.clamp(this.selectedIndex, 0, this.optionDatas.length -1)];
        if(this.labelCaption){
            if(data && data.optionString){
                this.labelCaption.string = data.optionString;
            }else{
                this.labelCaption.string = "";
            }
        }
        if(this.spriteCaption){
            if(data && data.optionSf){
                this.spriteCaption.spriteFrame = data.optionSf;
            }else{
                this.spriteCaption.spriteFrame = undefined;
            }
            this.spriteCaption.enabled = this.spriteCaption.spriteFrame != undefined;
        }
    }

    protected createDropDownList(template: cc.Node):  cc.Node {
        return cc.instantiate(template);
    }

    protected destroyDropDownList(dropDownList: cc.Node){
        dropDownList.destroy();
    }

    protected createItem(itemTemplate: DropDownItem): DropDownItem{
        let newItem = cc.instantiate(itemTemplate.node);
        return newItem.getComponent<DropDownItem>(DropDownItem);
    }

    /** 当toggle被选中 */
    private onSelectedItem(toggle: cc.Toggle) {
        let parent = toggle.node.parent;
        for (let i = 0; i <parent.childrenCount; i++)
            {
                if (parent.children[i] == toggle.node)
                {
                    // Subtract one to account for template child.
                    this.selectedIndex = i - 1;
                    break;
                }
            }
        this.hide();
    }

    private onClick() {
        if(!this.isShow){
            this.show();
        }else{
            this.hide();
        }
    }

    start(){
        this.template.active = false;
        this.refreshShownValue();
    }

    onEnable() {
        this.node.on("touchend", this.onClick, this);
    }

    onDisable() {
        this.node.off("touchend", this.onClick, this);
    }

    private clamp(value: number, min: number, max: number): number{
        if(value < min) return min;
        if(value > max) return max;
        return value;
    }
}
